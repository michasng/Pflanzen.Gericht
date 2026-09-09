import { supabase } from '@/lib/supabase'
import type { Rating, RatingInsert, RatingImage } from '@/types'

export const ADMIN_PAGE_SIZE = 50

export type AdminRatingItem = Rating & {
  profile: { username: string }
  product: { id: string; name: string }
}

export type RatingFields = Pick<
  RatingInsert,
  'overall' | 'taste' | 'consistency' | 'appearance' | 'nutrition' | 'value' | 'comment'
>

export const createRating = async (
  productId: string,
  userId: string,
  fields: RatingFields,
  tags: string[],
): Promise<Rating> => {
  const { data, error } = await supabase
    .from('rating')
    .insert({ ...fields, product_id: productId, user_id: userId })
    .select()
    .single()
  if (error) throw error

  if (tags.length) {
    const { error: tagError } = await supabase
      .from('rating_tag')
      .insert(tags.map((tag) => ({ rating_id: data.id, tag })))
    if (tagError) throw tagError
  }

  return data
}

export const uploadRatingImage = async (
  ratingId: string,
  userId: string,
  file: File,
  sortOrder: number,
): Promise<RatingImage> => {
  const path = `${userId}/${ratingId}/${crypto.randomUUID()}.webp`
  const { error: uploadError } = await supabase.storage
    .from('review-images')
    .upload(path, file, { contentType: 'image/webp' })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('rating_image')
    .insert({ rating_id: ratingId, storage_path: path, sort_order: sortOrder })
    .select()
    .single()
  if (error) throw error
  return data
}

export const fetchRatingForEdit = async (
  ratingId: string,
): Promise<(Rating & { tags: string[]; images: RatingImage[] }) | null> => {
  const { data, error } = await supabase
    .from('rating')
    .select('*, tags:rating_tag(tag), images:rating_image(id, storage_path, sort_order)')
    .eq('id', ratingId)
    .single()
  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return {
    ...data,
    tags: ((data.tags ?? []) as { tag: string }[]).map((t) => t.tag),
    images: (data.images as RatingImage[] | null) ?? [],
  }
}

export const updateRating = async (
  ratingId: string,
  fields: RatingFields,
  tags: string[],
): Promise<void> => {
  const { error } = await supabase.from('rating').update(fields).eq('id', ratingId)
  if (error) throw error

  const { error: delErr } = await supabase.from('rating_tag').delete().eq('rating_id', ratingId)
  if (delErr) throw delErr

  if (tags.length) {
    const { error: tagErr } = await supabase
      .from('rating_tag')
      .insert(tags.map((tag) => ({ rating_id: ratingId, tag })))
    if (tagErr) throw tagErr
  }
}

export const deleteRatingImage = async (id: string, storagePath: string): Promise<void> => {
  const { error } = await supabase.from('rating_image').delete().eq('id', id)
  if (error) throw error
  await supabase.storage.from('review-images').remove([storagePath])
}

export const fetchAllRatingsForAdmin = async (page = 0): Promise<AdminRatingItem[]> => {
  const { data, error } = await supabase
    .from('rating')
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
