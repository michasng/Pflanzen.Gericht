import { supabase } from '@/lib/supabase'
import { deleteImageVariants } from '@/lib/imageVariantStorage'
import type { Product, Review } from '@/types'

export type PublicProfile = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  created_at: string
}

export type ReviewWithMeta = Review & {
  product: Pick<Product, 'id' | 'name' | 'category'>
  tags: string[]
}

export const fetchUserReviews = async (
  userId: string,
  onlyCurrent = false,
): Promise<ReviewWithMeta[]> => {
  let query = supabase
    .from('review')
    .select('*, product:product_id(id, name, category), tags:review_tag(tag)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (onlyCurrent) query = query.eq('is_current', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((r) => ({
    ...r,
    product: r.product as Pick<Product, 'id' | 'name' | 'category'>,
    tags: ((r.tags ?? []) as { tag: string }[]).map((t) => t.tag),
  }))
}

export const fetchUserProducts = async (userId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('product')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export const updateProfile = async (
  userId: string,
  updates: { display_name?: string | null; bio?: string | null },
): Promise<void> => {
  const { error } = await supabase.from('profile').update(updates).eq('id', userId)
  if (error) throw error
}

export const deleteReview = async (reviewId: string): Promise<void> => {
  const { data: reviewImages, error: reviewImagesError } = await supabase
    .from('review_image')
    .select('storage_path')
    .eq('review_id', reviewId)
  if (reviewImagesError) throw reviewImagesError

  if (reviewImages?.length) {
    await deleteImageVariants(
      {
        removeVariants: async (paths) => {
          const { error: removeError } = await supabase.storage.from('review-images').remove(paths)
          if (removeError) throw removeError
        },
      },
      reviewImages.map((reviewImage) => reviewImage.storage_path),
    )
  }

  const { error } = await supabase.from('review').delete().eq('id', reviewId)
  if (error) throw error
}

export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const { data } = await supabase
    .from('profile')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  return data === null
}

export const fetchPublicProfile = async (userId: string): Promise<PublicProfile | null> => {
  const { data, error } = await supabase
    .from('profile')
    .select('id, username, display_name, bio, created_at')
    .eq('id', userId)
    .single()
  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return data
}
