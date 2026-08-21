import { supabase } from '@/lib/supabase'
import type { Rating, RatingInsert, RatingImage } from '@/types'

export type RatingFields = Pick<
  RatingInsert,
  | 'overall'
  | 'taste'
  | 'consistency'
  | 'appearance'
  | 'nutrition'
  | 'value'
  | 'comment'
  | 'location'
  | 'price'
>

export async function createRating(
  productId: string,
  userId: string,
  fields: RatingFields,
  tags: string[],
): Promise<Rating> {
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

export async function uploadRatingImage(
  ratingId: string,
  userId: string,
  file: File,
  sortOrder: number,
): Promise<RatingImage> {
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
