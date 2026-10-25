import { ref } from 'vue'
import { toErrorMessage } from '@/lib/error'
import type { ProfileGateway } from '@/services/ProfileGateway'

type CountGateway = Pick<ProfileGateway, 'countCurrentUserReviews' | 'countUserProducts'>

export const useProfileCounts = (gateway: CountGateway) => {
  const reviewsCount = ref(0)
  const productsCount = ref(0)
  const errorMessage = ref<string | null>(null)

  const loadCounts = async (userId: string): Promise<void> => {
    errorMessage.value = null
    try {
      const [reviews, products] = await Promise.all([
        gateway.countCurrentUserReviews(userId),
        gateway.countUserProducts(userId),
      ])
      reviewsCount.value = reviews
      productsCount.value = products
    } catch (err) {
      errorMessage.value = toErrorMessage(err)
    }
  }

  return { reviewsCount, productsCount, errorMessage, loadCounts }
}
