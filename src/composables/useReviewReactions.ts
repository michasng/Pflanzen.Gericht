import { ref, shallowRef } from 'vue'
import { toErrorMessage } from '@/lib/error'
import type { ProductDetailGateway } from '@/services/ProductDetailGateway'
import type { ReviewReaction } from '@/types/ReviewReaction'

interface ReviewReactionsOptions {
  gateway: Pick<ProductDetailGateway, 'addReaction' | 'removeReaction'>
  reviewId: string
  currentUserId: () => string | null
  currentUserProfile: () => ReviewReaction['profile'] | null
  initialReactions: readonly ReviewReaction[]
}

export const useReviewReactions = ({
  gateway,
  reviewId,
  currentUserId,
  currentUserProfile,
  initialReactions,
}: ReviewReactionsOptions) => {
  const reactions = shallowRef<readonly ReviewReaction[]>(initialReactions)
  const pendingEmojis = ref<readonly string[]>([])
  const errorMessage = ref<string | null>(null)

  const add = async (userId: string, profile: ReviewReaction['profile'], emoji: string) => {
    const optimistic: ReviewReaction = {
      emoji,
      userId,
      profile,
      createdAt: new Date().toISOString(),
    }
    reactions.value = [...reactions.value, optimistic]
    try {
      const saved = await gateway.addReaction(reviewId, userId, emoji)
      reactions.value = reactions.value.map((reaction) =>
        reaction === optimistic ? saved : reaction,
      )
    } catch (err) {
      reactions.value = reactions.value.filter((reaction) => reaction !== optimistic)
      throw err
    }
  }

  const remove = async (userId: string, existing: ReviewReaction) => {
    const index = reactions.value.indexOf(existing)
    reactions.value = reactions.value.filter((reaction) => reaction !== existing)
    try {
      await gateway.removeReaction(reviewId, userId, existing.emoji)
    } catch (err) {
      reactions.value = [
        ...reactions.value.slice(0, index),
        existing,
        ...reactions.value.slice(index),
      ]
      throw err
    }
  }

  const toggle = async (emoji: string): Promise<void> => {
    const userId = currentUserId()
    const profile = currentUserProfile()
    if (!userId || !profile || pendingEmojis.value.includes(emoji)) return

    errorMessage.value = null
    pendingEmojis.value = [...pendingEmojis.value, emoji]
    const existing = reactions.value.find(
      (reaction) => reaction.userId === userId && reaction.emoji === emoji,
    )
    try {
      await (existing ? remove(userId, existing) : add(userId, profile, emoji))
    } catch (err) {
      errorMessage.value = toErrorMessage(err)
    } finally {
      pendingEmojis.value = pendingEmojis.value.filter((pending) => pending !== emoji)
    }
  }

  return { reactions, pendingEmojis, errorMessage, toggle }
}
