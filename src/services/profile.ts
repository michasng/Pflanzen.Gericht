import { supabase } from '@/lib/supabase'
import type { Product, Rating } from '@/types'

export type RatingWithMeta = Rating & {
  product: Pick<Product, 'id' | 'name' | 'category'>
  tags: string[]
}

export async function fetchUserRatings(userId: string): Promise<RatingWithMeta[]> {
  const { data, error } = await supabase
    .from('rating')
    .select('*, product:product_id(id, name, category), tags:rating_tag(tag)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    ...r,
    product: r.product as Pick<Product, 'id' | 'name' | 'category'>,
    tags: ((r.tags ?? []) as { tag: string }[]).map((t) => t.tag),
  }))
}

export async function fetchUserProducts(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('product')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateProfile(
  userId: string,
  updates: { display_name?: string | null; bio?: string | null },
): Promise<void> {
  const { error } = await supabase.from('profile').update(updates).eq('id', userId)
  if (error) throw error
}

export async function deleteRating(ratingId: string): Promise<void> {
  const { error } = await supabase.from('rating').delete().eq('id', ratingId)
  if (error) throw error
}
