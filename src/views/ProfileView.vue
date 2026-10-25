<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toErrorMessage } from '@/lib/error'
import { useAuthStore } from '@/stores/auth'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { useProfileCounts } from '@/composables/useProfileCounts'
import { useProfileTab } from '@/composables/useProfileTab'
import { injectGateway } from '@/composables/injectGateway'
import { profileGatewayKey, type ProfileUpdates } from '@/services/ProfileGateway'
import ProductSummaryCard from '@/components/ProductSummaryCard.vue'
import ReviewSummaryCard from '@/components/ReviewSummaryCard.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMoreButton from '@/components/LoadMoreButton.vue'
import LoadingText from '@/components/LoadingText.vue'
import ProfileEditForm from '@/components/profile/ProfileEditForm.vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ProfileStats from '@/components/profile/ProfileStats.vue'
import { ProfileTab } from '@/components/profile/ProfileTab'
import Button from '@/components/primitives/ButtonComponent.vue'
import ButtonLink from '@/components/primitives/ButtonLink.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'
import TabBar from '@/components/primitives/TabBar.vue'
import type { TabBarItem } from '@/components/primitives/TabBarItem'
import Chip from '@/components/primitives/ChipComponent.vue'
import { ChipSize } from '@/components/primitives/ChipSize'
import { ChipTone } from '@/components/primitives/ChipTone'

const TABS: TabBarItem<ProfileTab>[] = [
  { value: ProfileTab.Reviews, label: 'Meine Bewertungen', ariaLabel: 'Meine Bewertungen' },
  { value: ProfileTab.Products, label: 'Meine Produkte', ariaLabel: 'Meine Produkte' },
]

const PROFILE_REVIEW_PAGE_SIZE = 20
const PROFILE_PRODUCT_PAGE_SIZE = 20

const router = useRouter()
const authStore = useAuthStore()
const profileGateway = injectGateway(profileGatewayKey)

const activeTab = useProfileTab()
const userId = computed(() => authStore.user?.id)

const isEditing = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)

const deleteError = ref<string | null>(null)

const reportDeleteError = (message: string): void => {
  deleteError.value = message
}

const {
  reviewsCount,
  productsCount,
  errorMessage: countsError,
  loadCounts,
} = useProfileCounts(profileGateway)

const {
  items: reviews,
  loading: loadingReviews,
  loadError: reviewsLoadError,
  hasMore: reviewsHaveMore,
  loadingMore: loadingMoreReviews,
  deletingId: deletingReviewId,
  loadFirstPage: loadFirstReviewPage,
  loadMore: loadMoreReviews,
  remove: removeReview,
} = usePaginatedList({
  fetchPage: async (page) =>
    userId.value
      ? profileGateway.fetchUserReviews(userId.value, {
          page,
          pageSize: PROFILE_REVIEW_PAGE_SIZE,
          onlyCurrent: false,
        })
      : [],
  pageSize: PROFILE_REVIEW_PAGE_SIZE,
  deleteItem: profileGateway.deleteReview,
  reportError: reportDeleteError,
})

const {
  items: products,
  loading: loadingProducts,
  loadError: productsLoadError,
  hasMore: productsHaveMore,
  loadingMore: loadingMoreProducts,
  deletingId: deletingProductId,
  loadFirstPage: loadFirstProductPage,
  loadMore: loadMoreProducts,
  remove: removeProduct,
} = usePaginatedList({
  fetchPage: async (page) =>
    userId.value
      ? profileGateway.fetchUserProducts(userId.value, {
          page,
          pageSize: PROFILE_PRODUCT_PAGE_SIZE,
        })
      : [],
  pageSize: PROFILE_PRODUCT_PAGE_SIZE,
  deleteItem: profileGateway.deleteProduct,
  reportError: reportDeleteError,
})

const loading = computed(() => loadingReviews.value || loadingProducts.value)
const loadError = computed(
  () => reviewsLoadError.value ?? productsLoadError.value ?? countsError.value,
)

watch(
  userId,
  (id) => {
    if (!id) return
    void Promise.all([loadFirstReviewPage(), loadFirstProductPage(), loadCounts(id)])
  },
  { immediate: true },
)

const refreshCounts = async (): Promise<void> => {
  if (userId.value) await loadCounts(userId.value)
}

const startEdit = (): void => {
  isEditing.value = true
  saveError.value = null
}

const cancelEdit = (): void => {
  isEditing.value = false
}

const saveProfileData = async (updates: ProfileUpdates): Promise<void> => {
  if (!authStore.user) return
  saving.value = true
  saveError.value = null
  try {
    await profileGateway.updateProfile(authStore.user.id, updates)
    await authStore.fetchProfile(authStore.user.id)
    isEditing.value = false
  } catch (err) {
    saveError.value = toErrorMessage(err)
  } finally {
    saving.value = false
  }
}

const handleSignOut = async (): Promise<void> => {
  await authStore.signOut()
  await router.push({ name: 'home' })
}

const handleDeleteProduct = async (id: string): Promise<void> => {
  if (!confirm('Produkt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'))
    return
  deleteError.value = null
  await removeProduct(id)
  await refreshCounts()
}

const handleDeleteReview = async (id: string): Promise<void> => {
  if (!confirm('Bewertung wirklich löschen?')) return
  deleteError.value = null
  await removeReview(id)
  await refreshCounts()
}

const handleLoadMoreReviews = async (): Promise<void> => {
  deleteError.value = null
  await loadMoreReviews()
}

const handleLoadMoreProducts = async (): Promise<void> => {
  deleteError.value = null
  await loadMoreProducts()
}
</script>

<template>
  <div class="max-w-lg mx-auto space-y-4">
    <ProfileHeader
      v-if="authStore.profile"
      :username="authStore.profile.username"
      :displayName="authStore.profile.displayName"
    >
      <template #subtitle>{{ authStore.user?.email }}</template>
    </ProfileHeader>

    <p v-if="authStore.profile?.bio && !isEditing" class="text-sm text-gray-600">
      {{ authStore.profile.bio }}
    </p>

    <ProfileEditForm
      v-if="isEditing"
      :initialDisplayName="authStore.profile?.displayName ?? null"
      :initialBio="authStore.profile?.bio ?? null"
      :saving="saving"
      :errorMessage="saveError"
      @save="saveProfileData"
      @cancel="cancelEdit"
    />

    <div v-else class="flex gap-2">
      <Button
        ariaLabel="Profil bearbeiten"
        :variant="ButtonVariant.Outlined"
        full-width
        @click="startEdit"
      >
        Profil bearbeiten
      </Button>
      <Button
        ariaLabel="Abmelden"
        :variant="ButtonVariant.Outlined"
        :tone="ButtonTone.Danger"
        full-width
        @click="handleSignOut"
      >
        Abmelden
      </Button>
    </div>

    <ProfileStats :reviewsCount="reviewsCount" :productsCount="productsCount" />

    <TabBar v-model="activeTab" :tabs="TABS" class="-mx-4 px-4" />

    <LoadingText v-if="loading" />
    <AlertMessage v-else-if="loadError" :message="loadError" />

    <template v-else-if="activeTab === ProfileTab.Reviews">
      <AlertMessage :message="deleteError" />
      <EmptyState v-if="reviews.length === 0" compact title="Noch keine Bewertungen abgegeben." />
      <ul v-else class="space-y-3">
        <li v-for="review in reviews" :key="review.id">
          <ReviewSummaryCard :review="review">
            <template #status>
              <Chip
                :size="ChipSize.Compact"
                :tone="review.isCurrent ? ChipTone.Success : ChipTone.Muted"
              >
                {{ review.isCurrent ? 'Aktuell' : 'Veraltet' }}
              </Chip>
            </template>
            <template #actions>
              <ButtonLink
                v-if="review.isCurrent"
                :to="{ name: 'review-edit', params: { reviewId: review.id } }"
                :variant="ButtonVariant.Text"
                :size="ButtonSize.Small"
              >
                Bearbeiten
              </ButtonLink>
              <ButtonLink
                :to="{ name: 'review-new', params: { id: review.product.id } }"
                :variant="ButtonVariant.Text"
                :size="ButtonSize.Small"
              >
                Neu bewerten
              </ButtonLink>
              <Button
                ariaLabel="Bewertung löschen"
                :variant="ButtonVariant.Text"
                :size="ButtonSize.Small"
                :tone="ButtonTone.Danger"
                :disabled="deletingReviewId === review.id"
                @click="handleDeleteReview(review.id)"
              >
                {{ deletingReviewId === review.id ? 'Löscht …' : 'Löschen' }}
              </Button>
            </template>
          </ReviewSummaryCard>
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

    <template v-else>
      <AlertMessage :message="deleteError" />
      <EmptyState v-if="products.length === 0" compact title="Noch keine Produkte hinzugefügt." />
      <ul v-else class="space-y-2">
        <li v-for="product in products" :key="product.id">
          <ProductSummaryCard :product="product">
            <template #actions>
              <ButtonLink
                :to="{ name: 'product-edit', params: { id: product.id } }"
                :variant="ButtonVariant.Text"
                :size="ButtonSize.Small"
              >
                Bearbeiten
              </ButtonLink>
              <Button
                ariaLabel="Produkt löschen"
                :variant="ButtonVariant.Text"
                :size="ButtonSize.Small"
                :tone="ButtonTone.Danger"
                :disabled="deletingProductId === product.id"
                @click="handleDeleteProduct(product.id)"
              >
                {{ deletingProductId === product.id ? 'Löscht …' : 'Löschen' }}
              </Button>
            </template>
          </ProductSummaryCard>
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
  </div>
</template>
