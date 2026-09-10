<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toErrorMessage } from '@/lib/error'
import { useAuthStore } from '@/stores/auth'
import {
  fetchUserRatings,
  fetchUserProducts,
  updateProfile,
  deleteRating,
  type RatingWithMeta,
} from '@/services/profile'
import { deleteProduct } from '@/services/products'
import type { Product } from '@/types'
import StarDisplay from '@/components/StarDisplay.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import TagList from '@/components/TagList.vue'
import ButtonComponent from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import CardComponent from '@/components/primitives/CardComponent.vue'
import ChipComponent from '@/components/primitives/ChipComponent.vue'
import { ChipSize } from '@/components/primitives/ChipSize'
import { ChipTone } from '@/components/primitives/ChipTone'
import { categoryToLabel } from '@/config/categories'
import { formatDate } from '@/lib/date'

const router = useRouter()
const authStore = useAuthStore()

const ratings = ref<RatingWithMeta[]>([])
const products = ref<Product[]>([])
const loading = ref(true)
const loadError = ref<string | null>(null)
const activeTab = ref<'ratings' | 'products'>('ratings')

const isEditing = ref(false)
const displayName = ref('')
const bio = ref('')
const saving = ref(false)
const saveError = ref<string | null>(null)

const deletingId = ref<string | null>(null)
const deletingProductId = ref<string | null>(null)

const currentRatingsCount = computed(() => ratings.value.filter((r) => r.is_current).length)
const initials = computed(() => authStore.profile?.username?.charAt(0).toUpperCase() ?? '?')

const startEdit = (): void => {
  displayName.value = authStore.profile?.display_name ?? ''
  bio.value = authStore.profile?.bio ?? ''
  isEditing.value = true
  saveError.value = null
}

const cancelEdit = (): void => {
  isEditing.value = false
}

const saveProfileData = async (): Promise<void> => {
  if (!authStore.user) return
  saving.value = true
  saveError.value = null
  try {
    await updateProfile(authStore.user.id, {
      display_name: displayName.value.trim() || null,
      bio: bio.value.trim() || null,
    })
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
    await deleteProduct(id)
    products.value = products.value.filter((p) => p.id !== id)
  } catch (err) {
    alert(toErrorMessage(err))
  } finally {
    deletingProductId.value = null
  }
}

const handleDeleteRating = async (id: string): Promise<void> => {
  if (!confirm('Bewertung wirklich löschen?')) return
  const user = authStore.user
  if (!user) return
  deletingId.value = id
  try {
    await deleteRating(id)
    ratings.value = await fetchUserRatings(user.id)
  } catch (err) {
    alert(toErrorMessage(err))
  } finally {
    deletingId.value = null
  }
}

onMounted(async () => {
  if (!authStore.user) return
  try {
    const [r, p] = await Promise.all([
      fetchUserRatings(authStore.user.id),
      fetchUserProducts(authStore.user.id),
    ])
    ratings.value = r
    products.value = p
  } catch (err) {
    loadError.value = toErrorMessage(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-lg mx-auto space-y-4">
    <div class="flex items-center gap-4 pt-2">
      <div
        class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold shrink-0"
        aria-hidden="true"
      >
        {{ initials }}
      </div>
      <div class="min-w-0">
        <p class="font-bold text-gray-900 text-lg leading-tight truncate">
          {{ authStore.profile?.display_name || authStore.profile?.username }}
        </p>
        <p v-if="authStore.profile?.display_name" class="text-sm text-gray-500 truncate">
          @{{ authStore.profile.username }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">{{ authStore.user?.email }}</p>
      </div>
    </div>

    <p v-if="authStore.profile?.bio && !isEditing" class="text-sm text-gray-600">
      {{ authStore.profile.bio }}
    </p>

    <form v-if="isEditing" class="space-y-3" @submit.prevent="saveProfileData">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="displayName">
          Anzeigename
        </label>
        <input
          id="displayName"
          v-model="displayName"
          type="text"
          maxlength="60"
          placeholder="z. B. Grüne Gabel"
          class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="bio">Bio</label>
        <textarea
          id="bio"
          v-model="bio"
          rows="2"
          maxlength="200"
          placeholder="Ein paar Worte über dich …"
          class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>
      <AlertMessage :message="saveError" />
      <div class="flex gap-2">
        <ButtonComponent
          ariaLabel="Speichern"
          type="submit"
          :variant="ButtonVariant.Filled"
          class="!flex-1"
          :disabled="saving"
        >
          {{ saving ? 'Speichert …' : 'Speichern' }}
        </ButtonComponent>
        <ButtonComponent
          ariaLabel="Abbrechen"
          :variant="ButtonVariant.Outlined"
          class="!flex-1 text-sm font-medium transition-colors"
          type="button"
          @click="cancelEdit"
        >
          Abbrechen
        </ButtonComponent>
      </div>
    </form>

    <div v-else class="flex gap-2">
      <ButtonComponent
        ariaLabel="Profil bearbeiten"
        :variant="ButtonVariant.Outlined"
        class="!flex-1 text-sm font-medium transition-colors"
        @click="startEdit"
      >
        Profil bearbeiten
      </ButtonComponent>
      <ButtonComponent
        ariaLabel="Abmelden"
        :variant="ButtonVariant.Outlined"
        class="!flex-1 !border-red-100 !text-red-600 text-sm font-medium transition-colors hover:!border-red-100 hover:!bg-red-50"
        @click="handleSignOut"
      >
        Abmelden
      </ButtonComponent>
    </div>

    <div class="flex gap-6 py-3 border-t border-b border-gray-100">
      <div class="text-center">
        <p class="text-xl font-bold text-gray-900">{{ currentRatingsCount }}</p>
        <p class="text-xs text-gray-500">Bewertungen</p>
      </div>
      <div class="text-center">
        <p class="text-xl font-bold text-gray-900">{{ products.length }}</p>
        <p class="text-xs text-gray-500">Produkte</p>
      </div>
    </div>

    <div class="flex border-b border-gray-200 -mx-4 px-4">
      <ButtonComponent
        ariaLabel="Meine Bewertungen"
        :variant="ButtonVariant.Text"
        class="!flex-1 !rounded-none !px-0 !py-2.5 !gap-0 text-sm font-medium transition-colors"
        :class="
          activeTab === 'ratings'
            ? '!text-primary-600 border-b-2 border-primary-600 -mb-px'
            : '!text-gray-500 hover:!text-gray-700'
        "
        @click="activeTab = 'ratings'"
      >
        Meine Bewertungen
      </ButtonComponent>
      <ButtonComponent
        ariaLabel="Meine Produkte"
        :variant="ButtonVariant.Text"
        class="!flex-1 !rounded-none !px-0 !py-2.5 !gap-0 text-sm font-medium transition-colors"
        :class="
          activeTab === 'products'
            ? '!text-primary-600 border-b-2 border-primary-600 -mb-px'
            : '!text-gray-500 hover:!text-gray-700'
        "
        @click="activeTab = 'products'"
      >
        Meine Produkte
      </ButtonComponent>
    </div>

    <LoadingText v-if="loading" />
    <AlertMessage v-else-if="loadError" :message="loadError" />

    <template v-else-if="activeTab === 'ratings'">
      <p v-if="ratings.length === 0" class="py-12 text-center text-gray-400 text-sm">
        Noch keine Bewertungen abgegeben.
      </p>
      <ul v-else class="space-y-3">
        <li v-for="rating in ratings" :key="rating.id">
          <CardComponent>
            <div class="flex items-start justify-between gap-2 mb-2">
              <RouterLink
                :to="{ name: 'product-detail', params: { id: rating.product.id } }"
                class="font-semibold text-gray-900 hover:text-primary-600 transition-colors leading-tight"
              >
                {{ rating.product.name }}
              </RouterLink>
              <ChipComponent
                class="shrink-0"
                :size="ChipSize.Compact"
                :tone="rating.is_current ? ChipTone.Success : ChipTone.Muted"
              >
                {{ rating.is_current ? 'Aktuell' : 'Veraltet' }}
              </ChipComponent>
            </div>

            <div class="flex items-center gap-2 mb-2">
              <StarDisplay :value="rating.overall" />
              <span class="text-xs text-gray-400">{{ formatDate(rating.created_at) }}</span>
            </div>

            <TagList :tags="rating.tags" class="mb-2" />

            <p v-if="rating.comment" class="text-sm text-gray-600 mb-2 line-clamp-2">
              {{ rating.comment }}
            </p>

            <div class="flex gap-3 pt-2 border-t border-gray-50">
              <RouterLink
                v-if="rating.is_current"
                :to="{ name: 'rating-edit', params: { ratingId: rating.id } }"
                class="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                Bearbeiten
              </RouterLink>
              <RouterLink
                :to="{ name: 'rating-new', params: { id: rating.product.id } }"
                class="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                Neu bewerten
              </RouterLink>
              <ButtonComponent
                ariaLabel="Bewertung löschen"
                :variant="ButtonVariant.Text"
                class="!px-0 !py-0 !text-xs !text-red-500 font-medium transition-colors hover:!text-red-600"
                :disabled="deletingId === rating.id"
                @click="handleDeleteRating(rating.id)"
              >
                {{ deletingId === rating.id ? 'Löscht …' : 'Löschen' }}
              </ButtonComponent>
            </div>
          </CardComponent>
        </li>
      </ul>
    </template>

    <template v-else>
      <p v-if="products.length === 0" class="py-12 text-center text-gray-400 text-sm">
        Noch keine Produkte hinzugefügt.
      </p>
      <ul v-else class="space-y-2">
        <li v-for="product in products" :key="product.id">
          <CardComponent>
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
            <p class="text-xs text-gray-400 mt-1">{{ formatDate(product.created_at) }}</p>
            <div class="flex gap-3 pt-2 border-t border-gray-50 mt-2">
              <RouterLink
                :to="{ name: 'product-edit', params: { id: product.id } }"
                class="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                Bearbeiten
              </RouterLink>
              <ButtonComponent
                ariaLabel="Produkt löschen"
                :variant="ButtonVariant.Text"
                class="!px-0 !py-0 !text-xs !text-red-500 font-medium transition-colors hover:!text-red-600"
                :disabled="deletingProductId === product.id"
                @click="handleDeleteProduct(product.id)"
              >
                {{ deletingProductId === product.id ? 'Löscht …' : 'Löschen' }}
              </ButtonComponent>
            </div>
          </CardComponent>
        </li>
      </ul>
    </template>
  </div>
</template>
