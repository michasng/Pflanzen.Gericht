import { supabase } from '@/lib/supabase'
import { camelizeKeys } from '@/lib/camelizeKeys'
import { snakeifyKeys } from '@/lib/snakeifyKeys'
import { generateSquareImageVariants } from '@/lib/generateSquareImageVariants'
import { deleteImageVariants, persistImageVariants } from '@/lib/imageVariantStorage'
import {
  copyStoredImageWithRecord,
  type StoredImageLocation,
} from '@/services/copyStoredImageWithRecord'
import type { Review, ReviewInsert, ReviewImage, ProductImage } from '@/types'
import type { Tables } from '@/types/database'

export const ADMIN_PAGE_SIZE = 50

export type AdminReviewItem = Review & {
  profile: { username: string }
  product: { id: string; name: string }
}

export type ReviewFields = Pick<
  ReviewInsert,
  'overall' | 'taste' | 'consistency' | 'appearance' | 'nutrition' | 'value' | 'comment'
>

export type ReviewHistory = Pick<ReviewInsert, 'createdAt' | 'updatedAt'>

export type ReviewWithDetails = Review & { tags: string[]; images: ReviewImage[] }

const REVIEW_WITH_DETAILS_SELECT =
  '*, tags:review_tag(tag), images:review_image(id, storage_path, sort_order)'

const toReviewWithDetails = (data: {
  tags: unknown
  images: unknown
}): { tags: string[]; images: Tables<'review_image'>[] } => ({
  tags: ((data.tags ?? []) as { tag: string }[]).map((t) => t.tag),
  images: (data.images as Tables<'review_image'>[] | null) ?? [],
})

export const createReview = async (
  productId: string,
  userId: string,
  fields: ReviewFields,
  tags: string[],
  history?: ReviewHistory,
): Promise<Review> => {
  const { data, error } = await supabase
    .from('review')
    .insert(snakeifyKeys({ ...fields, ...history, productId, userId }))
    .select()
    .single()
  if (error) throw error

  if (tags.length) {
    const { error: tagError } = await supabase
      .from('review_tag')
      .insert(tags.map((tag) => ({ review_id: data.id, tag })))
    if (tagError) throw tagError
  }

  return camelizeKeys(data)
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
      return camelizeKeys(data)
    },
  )
}

const copyImageToReview = async (
  source: StoredImageLocation,
  reviewId: string,
  userId: string,
  sortOrder: number,
): Promise<ReviewImage> => {
  const storagePath = `${userId}/${reviewId}/${crypto.randomUUID()}`
  const copiedImage = await copyStoredImageWithRecord<Tables<'review_image'>>(
    source,
    { bucketName: 'review-images', storagePath },
    () =>
      supabase
        .from('review_image')
        .insert({ review_id: reviewId, storage_path: storagePath, sort_order: sortOrder })
        .select()
        .single(),
    () => supabase.from('review_image').select('id').eq('storage_path', storagePath).maybeSingle(),
  )
  return camelizeKeys(copiedImage)
}

export const copyProductImageToReview = (
  productImage: ProductImage,
  reviewId: string,
  userId: string,
  sortOrder: number,
): Promise<ReviewImage> =>
  copyImageToReview(
    { bucketName: 'product-images', storagePath: productImage.storagePath },
    reviewId,
    userId,
    sortOrder,
  )

export const copyReviewImageToReview = (
  reviewImage: ReviewImage,
  reviewId: string,
  userId: string,
): Promise<ReviewImage> =>
  copyImageToReview(
    { bucketName: 'review-images', storagePath: reviewImage.storagePath },
    reviewId,
    userId,
    reviewImage.sortOrder,
  )

export const fetchProductReviews = async (productId: string): Promise<ReviewWithDetails[]> => {
  const { data, error } = await supabase
    .from('review')
    .select(REVIEW_WITH_DETAILS_SELECT)
    .eq('product_id', productId)
  if (error) throw error
  return camelizeKeys((data ?? []).map((row) => ({ ...row, ...toReviewWithDetails(row) })))
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
      images: camelizeKeys([...review.images].sort((a, b) => a.sort_order - b.sort_order)),
    }))
}

export const fetchReviewForEdit = async (reviewId: string): Promise<ReviewWithDetails | null> => {
  const { data, error } = await supabase
    .from('review')
    .select(REVIEW_WITH_DETAILS_SELECT)
    .eq('id', reviewId)
    .single()
  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return camelizeKeys({ ...data, ...toReviewWithDetails(data) })
}

export const updateReview = async (
  reviewId: string,
  fields: ReviewFields,
  tags: string[],
): Promise<void> => {
  const { error } = await supabase.from('review').update(snakeifyKeys(fields)).eq('id', reviewId)
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
  return camelizeKeys(
    (data ?? []).map((r) => ({
      ...r,
      profile: r.profile as { username: string },
      product: r.product as { id: string; name: string },
    })),
  )
}
