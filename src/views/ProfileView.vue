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
import type { Product } from '@/types'
import StarDisplay from '@/components/StarDisplay.vue'
import { CATEGORY_LABELS, TAG_LABELS } from '@/config/taxonomy'
import type { Category, Tag } from '@/config/taxonomy'
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

const currentRatingsCount = computed(() => ratings.value.filter((r) => r.is_current).length)
const initials = computed(() => authStore.profile?.username?.charAt(0).toUpperCase() ?? '?')

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat as Category] ?? cat
}

function tagLabel(tag: string): string {
  return TAG_LABELS[tag as Tag] ?? tag
}

function startEdit(): void {
  displayName.value = authStore.profile?.display_name ?? ''
  bio.value = authStore.profile?.bio ?? ''
  isEditing.value = true
  saveError.value = null
}

function cancelEdit(): void {
  isEditing.value = false
}

async function saveProfileData(): Promise<void> {
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

async function handleSignOut(): Promise<void> {
  await authStore.signOut()
  await router.push({ name: 'home' })
}

async function handleDeleteRating(id: string): Promise<void> {
  if (!confirm('Bewertung wirklich löschen?')) return
  deletingId.value = id
  try {
    await deleteRating(id)
    ratings.value = await fetchUserRatings(authStore.user!.id)
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
      <div
        v-if="saveError"
        role="alert"
        class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
      >
        {{ saveError }}
      </div>
      <div class="flex gap-2">
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          {{ saving ? 'Speichert …' : 'Speichern' }}
        </button>
        <button
          type="button"
          class="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          @click="cancelEdit"
        >
          Abbrechen
        </button>
      </div>
    </form>

    <div v-else class="flex gap-2">
      <button
        class="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        @click="startEdit"
      >
        Profil bearbeiten
      </button>
      <button
        class="flex-1 py-2 border border-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
        @click="handleSignOut"
      >
        Abmelden
      </button>
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
      <button
        class="flex-1 py-2.5 text-sm font-medium transition-colors"
        :class="
          activeTab === 'ratings'
            ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="activeTab = 'ratings'"
      >
        Meine Bewertungen
      </button>
      <button
        class="flex-1 py-2.5 text-sm font-medium transition-colors"
        :class="
          activeTab === 'products'
            ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="activeTab = 'products'"
      >
        Meine Produkte
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center text-gray-400 text-sm">Wird geladen …</div>
    <div
      v-else-if="loadError"
      role="alert"
      class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
    >
      {{ loadError }}
    </div>

    <template v-else-if="activeTab === 'ratings'">
      <p v-if="ratings.length === 0" class="py-12 text-center text-gray-400 text-sm">
        Noch keine Bewertungen abgegeben.
      </p>
      <ul v-else class="space-y-3">
        <li
          v-for="rating in ratings"
          :key="rating.id"
          class="bg-white rounded-xl border border-gray-100 p-4"
        >
          <div class="flex items-start justify-between gap-2 mb-2">
            <RouterLink
              :to="{ name: 'product-detail', params: { id: rating.product.id } }"
              class="font-semibold text-gray-900 hover:text-primary-600 transition-colors leading-tight"
            >
              {{ rating.product.name }}
            </RouterLink>
            <span
              class="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
              :class="
                rating.is_current ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
              "
            >
              {{ rating.is_current ? 'Aktuell' : 'Veraltet' }}
            </span>
          </div>

          <div class="flex items-center gap-2 mb-2">
            <StarDisplay :value="rating.overall" />
            <span class="text-xs text-gray-400">{{ formatDate(rating.created_at) }}</span>
          </div>

          <div v-if="rating.tags.length" class="flex flex-wrap gap-1 mb-2">
            <span
              v-for="tag in rating.tags"
              :key="tag"
              class="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
            >
              {{ tagLabel(tag) }}
            </span>
          </div>

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
            <button
              class="text-xs text-red-500 font-medium hover:text-red-600 transition-colors disabled:opacity-50"
              :disabled="deletingId === rating.id"
              @click="handleDeleteRating(rating.id)"
            >
              {{ deletingId === rating.id ? 'Löscht …' : 'Löschen' }}
            </button>
          </div>
        </li>
      </ul>
    </template>

    <template v-else>
      <p v-if="products.length === 0" class="py-12 text-center text-gray-400 text-sm">
        Noch keine Produkte hinzugefügt.
      </p>
      <ul v-else class="space-y-2">
        <li
          v-for="product in products"
          :key="product.id"
          class="bg-white rounded-xl border border-gray-100 p-4"
        >
          <RouterLink
            :to="{ name: 'product-detail', params: { id: product.id } }"
            class="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
          >
            {{ product.name }}
          </RouterLink>
          <p class="text-sm text-gray-500 mt-0.5">
            {{ categoryLabel(product.category) }}
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
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>
