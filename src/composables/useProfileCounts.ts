import { ref } from 'vue'
import { toErrorMessage } from '@/lib/error'
import type { ProfileGateway } from '@/services/ProfileGateway'

type CountGateway = Pick<
  ProfileGateway,
  'countCurrentUserReviews' | 'countUserProducts' | 'countUserLists'
>

interface ProfileCountsOptions {
  onlyPublicLists: boolean
}

export const useProfileCounts = (
  gateway: CountGateway,
  { onlyPublicLists }: ProfileCountsOptions,
) => {
  const reviewsCount = ref(0)
  const productsCount = ref(0)
  const listsCount = ref(0)
  const errorMessage = ref<string | null>(null)

  const loadCounts = async (userId: string): Promise<void> => {
    errorMessage.value = null
    try {
      const [reviews, products, lists] = await Promise.all([
        gateway.countCurrentUserReviews(userId),
        gateway.countUserProducts(userId),
        gateway.countUserLists(userId, onlyPublicLists),
      ])
      reviewsCount.value = reviews
      productsCount.value = products
      listsCount.value = lists
    } catch (err) {
      errorMessage.value = toErrorMessage(err)
    }
  }

  return { reviewsCount, productsCount, listsCount, errorMessage, loadCounts }
}
