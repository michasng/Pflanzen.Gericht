import { computed, ref } from 'vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { ProfileAudience } from '@/config/ProfileAudience'
import { PROFILE_PAGE_SIZE } from '@/config/profilePageSize'
import type { ProfileGateway } from '@/services/ProfileGateway'

type ContentGateway = Pick<
  ProfileGateway,
  'fetchUserReviews' | 'fetchUserProducts' | 'fetchUserLists'
>

interface ProfileContentOptions {
  gateway: ContentGateway
  userId: () => string | undefined
  audience: ProfileAudience
}

export const useProfileContent = ({ gateway, userId, audience }: ProfileContentOptions) => {
  const isOwner = audience === ProfileAudience.Owner
  const actionError = ref<string | null>(null)

  const reportActionError = (message: string): void => {
    actionError.value = message
  }

  const clearActionError = (): void => {
    actionError.value = null
  }

  const paginate = <T>(fetchPage: (id: string, page: number) => Promise<T[]>) => {
    const list = usePaginatedList<T>({
      fetchPage: async (page) => {
        const id = userId()
        return id ? fetchPage(id, page) : []
      },
      pageSize: PROFILE_PAGE_SIZE,
      reportError: reportActionError,
    })
    const loadMore = async (): Promise<void> => {
      clearActionError()
      await list.loadMore()
    }
    return { ...list, loadMore }
  }

  const reviews = paginate((id, page) =>
    gateway.fetchUserReviews(id, { page, pageSize: PROFILE_PAGE_SIZE, onlyCurrent: !isOwner }),
  )
  const products = paginate((id, page) =>
    gateway.fetchUserProducts(id, { page, pageSize: PROFILE_PAGE_SIZE }),
  )
  const lists = paginate((id, page) =>
    gateway.fetchUserLists(id, { page, pageSize: PROFILE_PAGE_SIZE, onlyPublic: !isOwner }),
  )

  const loading = computed(
    () => reviews.loading.value || products.loading.value || lists.loading.value,
  )
  const loadError = computed(
    () => reviews.loadError.value ?? products.loadError.value ?? lists.loadError.value,
  )

  const loadFirstPages = async (): Promise<void> => {
    await Promise.all([reviews.loadFirstPage(), products.loadFirstPage(), lists.loadFirstPage()])
  }

  return {
    reviews,
    products,
    lists,
    loading,
    loadError,
    actionError,
    reportActionError,
    clearActionError,
    loadFirstPages,
  }
}
