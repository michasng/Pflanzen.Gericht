<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { useProfileCounts } from '@/composables/useProfileCounts'
import { useProfileTab } from '@/composables/useProfileTab'
import { injectGateway } from '@/composables/injectGateway'
import { profileGatewayKey } from '@/services/ProfileGateway'
import ProductSummaryCard from '@/components/ProductSummaryCard.vue'
import ReviewSummaryCard from '@/components/ReviewSummaryCard.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMoreButton from '@/components/LoadMoreButton.vue'
import LoadingText from '@/components/LoadingText.vue'
import NotFoundMessage from '@/components/NotFoundMessage.vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ListSummaryList from '@/components/list/ListSummaryList.vue'
import ProfileStats from '@/components/profile/ProfileStats.vue'
import { ProfileTab } from '@/components/profile/ProfileTab'
import TabBar from '@/components/primitives/TabBar.vue'
import type { TabBarItem } from '@/components/primitives/TabBarItem'
import { formatDate } from '@/lib/date'

const PROFILE_LIST_PAGE_SIZE = 20
const PROFILE_REVIEW_PAGE_SIZE = 20
const PROFILE_PRODUCT_PAGE_SIZE = 20

const TABS: TabBarItem<ProfileTab>[] = [
  { value: ProfileTab.Reviews, label: 'Bewertungen', ariaLabel: 'Bewertungen' },
  { value: ProfileTab.Products, label: 'Produkte', ariaLabel: 'Produkte' },
  { value: ProfileTab.Lists, label: 'Listen', ariaLabel: 'Listen' },
]

const route = useRoute()
const profileGateway = injectGateway(profileGatewayKey)

const activeTab = useProfileTab()
const userId = computed(() => String(route.params.id))

const {
  reviewsCount,
  productsCount,
  listsCount,
  errorMessage: countsError,
  loadCounts,
} = useProfileCounts(profileGateway, { onlyPublicLists: true })

const loadMoreError = ref<string | null>(null)
const reportLoadMoreError = (message: string): void => {
  loadMoreError.value = message
}

// Visitors cannot delete anything, but the paginated list requires a deletion contract.
const deleteNothing = (): Promise<void> => Promise.resolve()

const {
  items: reviews,
  loadError: reviewsLoadError,
  hasMore: reviewsHaveMore,
  loadingMore: loadingMoreReviews,
  loadFirstPage: loadFirstReviewPage,
  loadMore: loadMoreReviews,
} = usePaginatedList({
  fetchPage: (page) =>
    profileGateway.fetchUserReviews(userId.value, {
      page,
      pageSize: PROFILE_REVIEW_PAGE_SIZE,
      onlyCurrent: true,
    }),
  pageSize: PROFILE_REVIEW_PAGE_SIZE,
  deleteItem: deleteNothing,
  reportError: reportLoadMoreError,
})

const {
  items: products,
  loadError: productsLoadError,
  hasMore: productsHaveMore,
  loadingMore: loadingMoreProducts,
  loadFirstPage: loadFirstProductPage,
  loadMore: loadMoreProducts,
} = usePaginatedList({
  fetchPage: (page) =>
    profileGateway.fetchUserProducts(userId.value, {
      page,
      pageSize: PROFILE_PRODUCT_PAGE_SIZE,
    }),
  pageSize: PROFILE_PRODUCT_PAGE_SIZE,
  deleteItem: deleteNothing,
  reportError: reportLoadMoreError,
})

const {
  items: lists,
  loadError: listsLoadError,
  hasMore: listsHaveMore,
  loadingMore: loadingMoreLists,
  loadFirstPage: loadFirstListPage,
  loadMore: loadMoreLists,
} = usePaginatedList({
  fetchPage: (page) =>
    profileGateway.fetchUserLists(userId.value, {
      page,
      pageSize: PROFILE_LIST_PAGE_SIZE,
      onlyPublic: true,
    }),
  pageSize: PROFILE_LIST_PAGE_SIZE,
  deleteItem: deleteNothing,
  reportError: reportLoadMoreError,
})

const {
  data: profile,
  loading,
  errorMessage,
  notFound,
} = useAsyncData(
  async (id: string) => {
    const publicProfile = await profileGateway.fetchPublicProfile(id)
    if (!publicProfile) return null

    await Promise.all([
      loadFirstReviewPage(),
      loadFirstProductPage(),
      loadFirstListPage(),
      loadCounts(id),
    ])
    const contentError =
      reviewsLoadError.value ?? productsLoadError.value ?? listsLoadError.value ?? countsError.value
    if (contentError) throw new Error(contentError)
    return publicProfile
  },
  () => userId.value,
)

const handleLoadMoreReviews = async (): Promise<void> => {
  loadMoreError.value = null
  await loadMoreReviews()
}

const handleLoadMoreProducts = async (): Promise<void> => {
  loadMoreError.value = null
  await loadMoreProducts()
}

const handleLoadMoreLists = async (): Promise<void> => {
  loadMoreError.value = null
  await loadMoreLists()
}
</script>

<template>
  <div class="max-w-lg mx-auto space-y-4">
    <LoadingText v-if="loading" />
    <NotFoundMessage v-else-if="notFound" message="Profil nicht gefunden." />
    <AlertMessage v-else-if="errorMessage" :message="errorMessage" />

    <template v-else-if="profile">
      <ProfileHeader :username="profile.username" :displayName="profile.displayName">
        <template #subtitle>Dabei seit {{ formatDate(profile.createdAt) }}</template>
      </ProfileHeader>

      <p v-if="profile.bio" class="text-sm text-gray-600">{{ profile.bio }}</p>

      <ProfileStats
        :reviewsCount="reviewsCount"
        :productsCount="productsCount"
        :listsCount="listsCount"
      />

      <TabBar v-model="activeTab" :tabs="TABS" class="-mx-4 px-4" />

      <AlertMessage :message="loadMoreError" />

      <template v-if="activeTab === ProfileTab.Reviews">
        <EmptyState v-if="reviews.length === 0" compact title="Noch keine Bewertungen." />
        <ul v-else class="space-y-3">
          <li v-for="review in reviews" :key="review.id">
            <ReviewSummaryCard :review="review" />
          </li>
        </ul>
        <div v-if="reviewsHaveMore" class="text-center">
          <LoadMoreButton
            ariaLabel="Mehr Bewertungen laden"
            :loading="loadingMoreReviews"
            @click="handleLoadMoreReviews"
          />
        </div>
      </template>

      <template v-else-if="activeTab === ProfileTab.Lists">
        <ListSummaryList
          :lists="lists"
          :showVisibility="false"
          :hasMore="listsHaveMore"
          :loadingMore="loadingMoreLists"
          emptyTitle="Noch keine öffentlichen Listen."
          @loadMore="handleLoadMoreLists"
        />
      </template>

      <template v-else>
        <EmptyState v-if="products.length === 0" compact title="Noch keine Produkte hinzugefügt." />
        <ul v-else class="space-y-2">
          <li v-for="product in products" :key="product.id">
            <ProductSummaryCard :product="product" />
          </li>
        </ul>
        <div v-if="productsHaveMore" class="text-center">
          <LoadMoreButton
            ariaLabel="Mehr Produkte laden"
            :loading="loadingMoreProducts"
            @click="handleLoadMoreProducts"
          />
        </div>
      </template>
    </template>
  </div>
</template>
