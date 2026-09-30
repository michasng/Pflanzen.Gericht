import { supabase } from '@/lib/supabase'
import { generateSquareImageVariants } from '@/lib/generateSquareImageVariants'
import { deleteImageVariants, persistImageVariants } from '@/lib/imageVariantStorage'
import { copyStoredImageWithRecord } from '@/services/copyStoredImageWithRecord'
import type { Review, ReviewInsert, ReviewImage, ProductImage } from '@/types'

export const ADMIN_PAGE_SIZE = 50

export type AdminReviewItem = Review & {
  profile: { username: string }
  product: { id: string; name: string }
}

export type ReviewFields = Pick<
  ReviewInsert,
  'overall' | 'taste' | 'consistency' | 'appearance' | 'nutrition' | 'value' | 'comment'
>

export const createReview = async (
  productId: string,
  userId: string,
  fields: ReviewFields,
  tags: string[],
): Promise<Review> => {
  const { data, error } = await supabase
    .from('review')
    .insert({ ...fields, product_id: productId, user_id: userId })
    .select()
    .single()
  if (error) throw error

  if (tags.length) {
    const { error: tagError } = await supabase
      .from('review_tag')
      .insert(tags.map((tag) => ({ review_id: data.id, tag })))
    if (tagError) throw tagError
  }

  return data
}

export const uploadReviewImage = async (
  reviewId: string,
  userId: string,
  file: File,
  sortOrder: number,
): Promise<ReviewImage> => {
  const bucket = supabase.storage.from('review-images')
  const storagePath = `${userId}/${reviewId}/${crypto.randomUUID()}`
  const variants = await generateSquareImageVariants(file)
  return persistImageVariants(
    {
      removeVariants: async (paths) => {
        const { error } = await bucket.remove(paths)
        if (error) throw error
      },
      uploadVariant: async (path, variantFile) => {
        const { error } = await bucket.upload(path, variantFile, { contentType: 'image/webp' })
        return { error }
      },
    },
    storagePath,
    variants,
    async () => {
      const { data, error } = await supabase
        .from('review_image')
        .insert({ review_id: reviewId, storage_path: storagePath, sort_order: sortOrder })
        .select()
        .single()
      if (error) throw error
      return data
    },
  )
}

export const copyProductImageToReview = (
  productImage: ProductImage,
  reviewId: string,
  userId: string,
  sortOrder: number,
): Promise<ReviewImage> => {
  const storagePath = `${userId}/${reviewId}/${crypto.randomUUID()}`
  return copyStoredImageWithRecord(
    { bucketName: 'product-images', storagePath: productImage.storage_path },
    { bucketName: 'review-images', storagePath },
    () =>
      supabase
        .from('review_image')
        .insert({ review_id: reviewId, storage_path: storagePath, sort_order: sortOrder })
        .select()
        .single(),
  )
}

export interface ProductReviewImages {
  reviewId: string
  reviewerName: string
  createdAt: string
  images: ReviewImage[]
}

export const fetchProductReviewImages = async (
  productId: string,
): Promise<ProductReviewImages[]> => {
  const { data, error } = await supabase
    .from('review')
    .select('id, created_at, profile:user_id(username, display_name), images:review_image(*)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? [])
    .filter((review) => review.images.length > 0)
    .map((review) => ({
      reviewId: review.id,
      reviewerName: review.profile.display_name || review.profile.username,
      createdAt: review.created_at,
      images: [...review.images].sort((a, b) => a.sort_order - b.sort_order),
    }))
}

export const fetchReviewForEdit = async (
  reviewId: string,
): Promise<(Review & { tags: string[]; images: ReviewImage[] }) | null> => {
  const { data, error } = await supabase
    .from('review')
    .select('*, tags:review_tag(tag), images:review_image(id, storage_path, sort_order)')
    .eq('id', reviewId)
    .single()
  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return {
    ...data,
    tags: ((data.tags ?? []) as { tag: string }[]).map((t) => t.tag),
    images: (data.images as ReviewImage[] | null) ?? [],
  }
}

export const updateReview = async (
  reviewId: string,
  fields: ReviewFields,
  tags: string[],
): Promise<void> => {
  const { error } = await supabase.from('review').update(fields).eq('id', reviewId)
  if (error) throw error

  const { error: delErr } = await supabase.from('review_tag').delete().eq('review_id', reviewId)
  if (delErr) throw delErr

  if (tags.length) {
    const { error: tagErr } = await supabase
      .from('review_tag')
      .insert(tags.map((tag) => ({ review_id: reviewId, tag })))
    if (tagErr) throw tagErr
  }
}

export const deleteReviewImage = async (id: string, storagePath: string): Promise<void> => {
  const { error } = await supabase.from('review_image').delete().eq('id', id)
  if (error) throw error
  await deleteImageVariants(
    {
      removeVariants: async (paths) => {
        const { error: removeError } = await supabase.storage.from('review-images').remove(paths)
        if (removeError) throw removeError
      },
    },
    [storagePath],
  )
}

export const fetchAllReviewsForAdmin = async (page = 0): Promise<AdminReviewItem[]> => {
  const { data, error } = await supabase
    .from('review')
    .select('*, profile:user_id(username), product:product_id(id, name)')
    .order('created_at', { ascending: false })
    .range(page * ADMIN_PAGE_SIZE, (page + 1) * ADMIN_PAGE_SIZE - 1)
  if (error) throw error
  return (data ?? []).map((r) => ({
    ...r,
    profile: r.profile as { username: string },
    product: r.product as { id: string; name: string },
  }))
}
