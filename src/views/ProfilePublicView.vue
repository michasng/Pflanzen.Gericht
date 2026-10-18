<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData } from '@/composables/useAsyncData'
import { injectGateway } from '@/composables/injectGateway'
import { profileGatewayKey } from '@/services/ProfileGateway'
import ProductSummaryCard from '@/components/ProductSummaryCard.vue'
import ReviewSummaryCard from '@/components/ReviewSummaryCard.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingText from '@/components/LoadingText.vue'
import NotFoundMessage from '@/components/NotFoundMessage.vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ProfileStats from '@/components/profile/ProfileStats.vue'
import { ProfileTab } from '@/components/profile/ProfileTab'
import TabBar from '@/components/primitives/TabBar.vue'
import type { TabBarItem } from '@/components/primitives/TabBarItem'
import { formatDate } from '@/lib/date'

const TABS: TabBarItem<ProfileTab>[] = [
  { value: ProfileTab.Reviews, label: 'Bewertungen', ariaLabel: 'Bewertungen' },
  { value: ProfileTab.Products, label: 'Produkte', ariaLabel: 'Produkte' },
]

const route = useRoute()
const profileGateway = injectGateway(profileGatewayKey)

const activeTab = ref(ProfileTab.Reviews)

const {
  data: pageData,
  loading,
  errorMessage,
  notFound,
} = useAsyncData(
  async (userId: string) => {
    const profile = await profileGateway.fetchPublicProfile(userId)
    if (!profile) return null

    const [reviews, products] = await Promise.all([
      profileGateway.fetchUserReviews(userId, true),
      profileGateway.fetchUserProducts(userId),
    ])
    return { profile, reviews, products }
  },
  () => String(route.params.id),
)

const profile = computed(() => pageData.value?.profile ?? null)
const reviews = computed(() => pageData.value?.reviews ?? [])
const products = computed(() => pageData.value?.products ?? [])
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

      <ProfileStats :reviewsCount="reviews.length" :productsCount="products.length" />

      <TabBar v-model="activeTab" :tabs="TABS" class="-mx-4 px-4" />

      <template v-if="activeTab === ProfileTab.Reviews">
        <EmptyState v-if="reviews.length === 0" compact title="Noch keine Bewertungen." />
        <ul v-else class="space-y-3">
          <li v-for="review in reviews" :key="review.id">
            <ReviewSummaryCard :review="review" />
          </li>
        </ul>
      </template>

      <template v-else>
        <EmptyState v-if="products.length === 0" compact title="Noch keine Produkte hinzugefügt." />
        <ul v-else class="space-y-2">
          <li v-for="product in products" :key="product.id">
            <ProductSummaryCard :product="product" />
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>
