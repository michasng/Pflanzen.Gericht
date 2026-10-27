import { supabase } from '@/lib/supabase'
import { camelizeKeys } from '@/lib/camelizeKeys'
import type { ReviewReaction } from '@/types/ReviewReaction'

export const addReviewReaction = async (
  reviewId: string,
  userId: string,
  emoji: string,
): Promise<ReviewReaction> => {
  const { data, error } = await supabase
    .from('review_reaction')
    .insert({ review_id: reviewId, user_id: userId, emoji })
    .select('emoji, user_id, created_at, profile:user_id(username, display_name)')
    .single()
  if (error) throw error
  return camelizeKeys(data)
}

export const removeReviewReaction = async (
  reviewId: string,
  userId: string,
  emoji: string,
): Promise<void> => {
  const { error } = await supabase
    .from('review_reaction')
    .delete()
    .eq('review_id', reviewId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
  if (error) throw error
}

export const createReviewReaction = async (
  reviewId: string,
  userId: string,
  emoji: string,
  createdAt: string,
): Promise<void> => {
  const { error } = await supabase
    .from('review_reaction')
    .insert({ review_id: reviewId, user_id: userId, emoji, created_at: createdAt })
  if (error) throw error
}
