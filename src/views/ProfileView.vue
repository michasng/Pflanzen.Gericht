<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toErrorMessage } from '@/lib/error'
import { useAuthStore } from '@/stores/auth'
import { useAsyncData } from '@/composables/useAsyncData'
import { useDeletableList } from '@/composables/useDeletableList'
import { injectGateway } from '@/composables/injectGateway'
import { profileGatewayKey, type ProfileUpdates } from '@/services/ProfileGateway'
import type { ReviewWithMeta } from '@/services/profile'
import type { Product } from '@/types'
import ProductSummaryCard from '@/components/ProductSummaryCard.vue'
import ReviewSummaryCard from '@/components/ReviewSummaryCard.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingText from '@/components/LoadingText.vue'
import NotFoundMessage from '@/components/NotFoundMessage.vue'
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

const router = useRouter()
const authStore = useAuthStore()
const profileGateway = injectGateway(profileGatewayKey)

const reviews = ref<ReviewWithMeta[]>([])
const products = ref<Product[]>([])
const activeTab = ref(ProfileTab.Reviews)

const isEditing = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)

const deleteError = ref<string | null>(null)

const {
  data: userContent,
  loading,
  errorMessage: loadError,
  notFound,
} = useAsyncData(
  async (userId: string | undefined) => {
    if (!userId) return null

    const [userReviews, userProducts] = await Promise.all([
      profileGateway.fetchUserReviews(userId),
      profileGateway.fetchUserProducts(userId),
    ])
    return { reviews: userReviews, products: userProducts }
  },
  () => authStore.user?.id,
)

watch(
  userContent,
  (content) => {
    reviews.value = content?.reviews ?? []
    products.value = content?.products ?? []
  },
  { immediate: true },
)

const reportDeleteError = (message: string): void => {
  deleteError.value = message
}

const { deletingId: deletingReviewId, remove: removeReview } = useDeletableList({
  items: reviews,
  deleteItem: profileGateway.deleteReview,
  reportError: reportDeleteError,
})

const { deletingId: deletingProductId, remove: removeProduct } = useDeletableList({
  items: products,
  deleteItem: profileGateway.deleteProduct,
  reportError: reportDeleteError,
})

const currentReviewsCount = computed(() => reviews.value.filter((r) => r.isCurrent).length)

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
}

const handleDeleteReview = async (id: string): Promise<void> => {
  if (!confirm('Bewertung wirklich löschen?')) return
  deleteError.value = null
  await removeReview(id)
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

    <ProfileStats :reviewsCount="currentReviewsCount" :productsCount="products.length" />

    <TabBar v-model="activeTab" :tabs="TABS" class="-mx-4 px-4" />

    <LoadingText v-if="loading" />
    <NotFoundMessage v-else-if="notFound" message="Profil nicht gefunden." />
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
    </template>
  </div>
</template>
