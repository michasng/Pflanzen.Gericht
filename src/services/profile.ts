import { supabase } from '@/lib/supabase'
import { deleteImageVariants } from '@/lib/imageVariantStorage'
import { camelizeKeys } from '@/lib/camelizeKeys'
import { snakeifyKeys } from '@/lib/snakeifyKeys'
import { toPageRange } from '@/lib/toPageRange'
import type { CoverImageCandidate } from '@/lib/CoverImageCandidate'
import type { PageRequest } from '@/lib/PageRequest'
import type { ProductWithImages } from '@/lib/ProductWithImages'
import type { Product, Profile, Review } from '@/types'

export type PublicProfile = Pick<Profile, 'id' | 'username' | 'displayName' | 'bio' | 'createdAt'>

export type ReviewWithMeta = Review & {
  product: Pick<Product, 'id' | 'name' | 'category'> & { images: CoverImageCandidate[] }
  images: CoverImageCandidate[]
  tags: string[]
}

export interface UserReviewsPageRequest extends PageRequest {
  onlyCurrent: boolean
}

export interface UserListsPageRequest extends PageRequest {
  onlyPublic: boolean
}

export const fetchUserReviews = async (
  userId: string,
  request: UserReviewsPageRequest,
): Promise<ReviewWithMeta[]> => {
  let query = supabase
    .from('review')
    .select(
      '*, product:product_id(id, name, category, images:product_image(storage_path, sort_order)), images:review_image(storage_path, sort_order), tags:review_tag(tag)',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(...toPageRange(request))
  if (request.onlyCurrent) query = query.eq('is_current', true)
  const { data, error } = await query
  if (error) throw error
  return camelizeKeys(
    (data ?? []).map((r) => ({
      ...r,
      product: r.product as Pick<Product, 'id' | 'name' | 'category'> & {
        images: { storage_path: string; sort_order: number }[]
      },
      tags: ((r.tags ?? []) as { tag: string }[]).map((t) => t.tag),
    })),
  )
}

export const fetchUserProducts = async (
  userId: string,
  request: PageRequest,
): Promise<ProductWithImages[]> => {
  const { data, error } = await supabase
    .from('product')
    .select('*, images:product_image(storage_path, sort_order)')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .range(...toPageRange(request))
  if (error) throw error
  return camelizeKeys(data ?? [])
}

export const countCurrentUserReviews = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('review')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_current', true)
  if (error) throw error
  return count ?? 0
}

export const countUserProducts = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('product')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
  if (error) throw error
  return count ?? 0
}

export const updateProfile = async (
  userId: string,
  updates: { displayName?: string | null; bio?: string | null },
): Promise<void> => {
  const { error } = await supabase.from('profile').update(snakeifyKeys(updates)).eq('id', userId)
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
  return camelizeKeys(data)
}
