<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData } from '@/composables/useAsyncData'
import { useProfileContent } from '@/composables/useProfileContent'
import { useProfileCounts } from '@/composables/useProfileCounts'
import { useProfileTab } from '@/composables/useProfileTab'
import { injectGateway } from '@/composables/injectGateway'
import { ProfileAudience } from '@/config/ProfileAudience'
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

const {
  reviews,
  products,
  lists,
  loadError: contentLoadError,
  actionError,
  loadFirstPages,
} = useProfileContent({
  gateway: profileGateway,
  userId: () => userId.value,
  audience: ProfileAudience.Visitor,
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

    await Promise.all([loadFirstPages(), loadCounts(id)])
    const contentError = contentLoadError.value ?? countsError.value
    if (contentError) throw new Error(contentError)
    return publicProfile
  },
  () => userId.value,
)
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

      <AlertMessage :message="actionError" />

      <template v-if="activeTab === ProfileTab.Reviews">
        <EmptyState
          v-if="reviews.items.value.length === 0"
          compact
          title="Noch keine Bewertungen."
        />
        <ul v-else class="space-y-3">
          <li v-for="review in reviews.items.value" :key="review.id">
            <ReviewSummaryCard :review="review" />
          </li>
        </ul>
        <div v-if="reviews.hasMore.value" class="text-center">
          <LoadMoreButton
            ariaLabel="Mehr Bewertungen laden"
            :loading="reviews.loadingMore.value"
            @click="reviews.loadMore"
          />
        </div>
      </template>

      <template v-else-if="activeTab === ProfileTab.Lists">
        <ListSummaryList
          :lists="lists.items.value"
          :showVisibility="false"
          :hasMore="lists.hasMore.value"
          :loadingMore="lists.loadingMore.value"
          emptyTitle="Noch keine öffentlichen Listen."
          @loadMore="lists.loadMore"
        />
      </template>

      <template v-else>
        <EmptyState
          v-if="products.items.value.length === 0"
          compact
          title="Noch keine Produkte hinzugefügt."
        />
        <ul v-else class="space-y-2">
          <li v-for="product in products.items.value" :key="product.id">
            <ProductSummaryCard :product="product" />
          </li>
        </ul>
        <div v-if="products.hasMore.value" class="text-center">
          <LoadMoreButton
            ariaLabel="Mehr Produkte laden"
            :loading="products.loadingMore.value"
            @click="products.loadMore"
          />
        </div>
      </template>
    </template>
  </div>
</template>
