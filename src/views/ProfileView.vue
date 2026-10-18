<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toErrorMessage } from '@/lib/error'
import { useAuthStore } from '@/stores/auth'
import { useAsyncData } from '@/composables/useAsyncData'
import { injectGateway } from '@/composables/injectGateway'
import { profileGatewayKey } from '@/services/profileGatewayKey'
import type { ProfileUpdates } from '@/services/ProfileGateway'
import type { ReviewWithMeta } from '@/services/profile'
import type { Product } from '@/types'
import StarDisplay from '@/components/StarDisplay.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingText from '@/components/LoadingText.vue'
import NotFoundMessage from '@/components/NotFoundMessage.vue'
import TagList from '@/components/TagList.vue'
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
import Card from '@/components/primitives/CardComponent.vue'
import Chip from '@/components/primitives/ChipComponent.vue'
import { ChipSize } from '@/components/primitives/ChipSize'
import { ChipTone } from '@/components/primitives/ChipTone'
import { categoryToLabel } from '@/config/categories'
import { formatDate } from '@/lib/date'

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

const deletingId = ref<string | null>(null)
const deletingProductId = ref<string | null>(null)

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
  deletingProductId.value = id
  try {
    await profileGateway.deleteProduct(id)
    products.value = products.value.filter((p) => p.id !== id)
  } catch (err) {
    alert(toErrorMessage(err))
  } finally {
    deletingProductId.value = null
  }
}

const handleDeleteReview = async (id: string): Promise<void> => {
  if (!confirm('Bewertung wirklich löschen?')) return
  const user = authStore.user
  if (!user) return
  deletingId.value = id
  try {
    await profileGateway.deleteReview(id)
    reviews.value = await profileGateway.fetchUserReviews(user.id)
  } catch (err) {
    alert(toErrorMessage(err))
  } finally {
    deletingId.value = null
  }
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
      <EmptyState v-if="reviews.length === 0" compact title="Noch keine Bewertungen abgegeben." />
      <ul v-else class="space-y-3">
        <li v-for="review in reviews" :key="review.id">
          <Card>
            <div class="flex items-start justify-between gap-2 mb-2">
              <RouterLink
                :to="{ name: 'product-detail', params: { id: review.product.id } }"
                class="font-semibold text-gray-900 hover:text-primary-600 transition-colors leading-tight"
              >
                {{ review.product.name }}
              </RouterLink>
              <Chip
                class="shrink-0"
                :size="ChipSize.Compact"
                :tone="review.isCurrent ? ChipTone.Success : ChipTone.Muted"
              >
                {{ review.isCurrent ? 'Aktuell' : 'Veraltet' }}
              </Chip>
            </div>

            <div class="flex items-center gap-2 mb-2">
              <StarDisplay :value="review.overall" />
              <span class="text-xs text-gray-400">{{ formatDate(review.createdAt) }}</span>
            </div>

            <TagList :tags="review.tags" class="mb-2" />

            <p v-if="review.comment" class="text-sm text-gray-600 mb-2 line-clamp-2">
              {{ review.comment }}
            </p>

            <div class="flex gap-3 pt-2 border-t border-gray-50">
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
                :disabled="deletingId === review.id"
                @click="handleDeleteReview(review.id)"
              >
                {{ deletingId === review.id ? 'Löscht …' : 'Löschen' }}
              </Button>
            </div>
          </Card>
        </li>
      </ul>
    </template>

    <template v-else>
      <EmptyState v-if="products.length === 0" compact title="Noch keine Produkte hinzugefügt." />
      <ul v-else class="space-y-2">
        <li v-for="product in products" :key="product.id">
          <Card>
            <RouterLink
              :to="{ name: 'product-detail', params: { id: product.id } }"
              class="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
            >
              {{ product.name }}
            </RouterLink>
            <p class="text-sm text-gray-500 mt-0.5">
              {{ categoryToLabel(product.category) }}
              <span v-if="product.brand"> · {{ product.brand }}</span>
            </p>
            <p class="text-xs text-gray-400 mt-1">{{ formatDate(product.createdAt) }}</p>
            <div class="flex gap-3 pt-2 border-t border-gray-50 mt-2">
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
            </div>
          </Card>
        </li>
      </ul>
    </template>
  </div>
</template>
