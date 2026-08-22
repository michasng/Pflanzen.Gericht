import { supabase } from '@/lib/supabase'
import type { Product, Rating } from '@/types'

export type PublicProfile = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  created_at: string
}

export type RatingWithMeta = Rating & {
  product: Pick<Product, 'id' | 'name' | 'category'>
  tags: string[]
}

export const fetchUserRatings = async (
  userId: string,
  onlyCurrent = false,
): Promise<RatingWithMeta[]> => {
  let query = supabase
    .from('rating')
    .select('*, product:product_id(id, name, category), tags:rating_tag(tag)')
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

export const deleteRating = async (ratingId: string): Promise<void> => {
  const { data: images } = await supabase
    .from('rating_image')
    .select('storage_path')
    .eq('rating_id', ratingId)

  const { error } = await supabase.from('rating').delete().eq('id', ratingId)
  if (error) throw error

  if (images?.length) {
    await supabase.storage.from('review-images').remove(images.map((img) => img.storage_path))
  }
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
