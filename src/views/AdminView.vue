<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchAllProductsForAdmin, deleteProduct } from '@/services/products'
import { fetchAllRatingsForAdmin, type AdminRatingItem } from '@/services/ratings'
import { deleteRating } from '@/services/profile'
import { toErrorMessage } from '@/lib/error'
import { CATEGORY_LABELS } from '@/config/taxonomy'
import type { Category } from '@/config/taxonomy'
import type { ProductListItem } from '@/services/catalog'
import StarDisplay from '@/components/StarDisplay.vue'
import { formatDate } from '@/lib/date'

const activeTab = ref<'products' | 'ratings'>('products')
const products = ref<ProductListItem[]>([])
const ratings = ref<AdminRatingItem[]>([])
const loading = ref(true)
const loadError = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const productPage = ref(0)
const productHasMore = ref(true)
const ratingPage = ref(0)
const ratingHasMore = ref(true)
const loadingMore = ref(false)

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat as Category] ?? cat
}

onMounted(async () => {
  try {
    const [p, r] = await Promise.all([fetchAllProductsForAdmin(), fetchAllRatingsForAdmin()])
    products.value = p
    productHasMore.value = p.length === 50
    ratings.value = r
    ratingHasMore.value = r.length === 50
  } catch (err) {
    loadError.value = toErrorMessage(err)
  } finally {
    loading.value = false
  }
})

async function loadMoreProducts(): Promise<void> {
  loadingMore.value = true
  try {
    productPage.value++
    const more = await fetchAllProductsForAdmin(productPage.value)
    products.value.push(...more)
    productHasMore.value = more.length === 50
  } catch (err) {
    alert(toErrorMessage(err))
  } finally {
    loadingMore.value = false
  }
}

async function loadMoreRatings(): Promise<void> {
  loadingMore.value = true
  try {
    ratingPage.value++
    const more = await fetchAllRatingsForAdmin(ratingPage.value)
    ratings.value.push(...more)
    ratingHasMore.value = more.length === 50
  } catch (err) {
    alert(toErrorMessage(err))
  } finally {
    loadingMore.value = false
  }
}

async function handleDeleteProduct(id: string): Promise<void> {
  if (!confirm('Produkt und alle zugehörigen Bewertungen unwiderruflich löschen?')) return
  deletingId.value = id
  try {
    await deleteProduct(id)
    products.value = products.value.filter((p) => p.id !== id)
  } catch (err) {
    alert(toErrorMessage(err))
  } finally {
    deletingId.value = null
  }
}

async function handleDeleteRating(id: string): Promise<void> {
  if (!confirm('Bewertung unwiderruflich löschen?')) return
  deletingId.value = id
  try {
    await deleteRating(id)
    ratings.value = ratings.value.filter((r) => r.id !== id)
  } catch (err) {
    alert(toErrorMessage(err))
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-xl font-bold text-gray-900 mb-4">Administration</h1>

    <div v-if="loading" class="py-12 text-center text-gray-400 text-sm">Wird geladen …</div>
    <div
      v-else-if="loadError"
      role="alert"
      class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
    >
      {{ loadError }}
    </div>

    <template v-else>
      <div class="flex border-b border-gray-200 mb-4">
        <button
          class="flex-1 py-2.5 text-sm font-medium transition-colors"
          :class="
            activeTab === 'products'
              ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
              : 'text-gray-500 hover:text-gray-700'
          "
          @click="activeTab = 'products'"
        >
          Produkte ({{ products.length }})
        </button>
        <button
          class="flex-1 py-2.5 text-sm font-medium transition-colors"
          :class="
            activeTab === 'ratings'
              ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
              : 'text-gray-500 hover:text-gray-700'
          "
          @click="activeTab = 'ratings'"
        >
          Bewertungen ({{ ratings.length }})
        </button>
      </div>

      <template v-if="activeTab === 'products'">
        <p v-if="products.length === 0" class="py-12 text-center text-gray-400 text-sm">
          Keine Produkte vorhanden.
        </p>
        <ul v-else class="space-y-2">
          <li
            v-for="product in products"
            :key="product.id"
            class="bg-white rounded-xl border border-gray-100 p-4"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
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
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ product.ratings_count }} Bewertungen · {{ formatDate(product.created_at) }}
                </p>
              </div>
              <div class="flex gap-2 shrink-0">
                <RouterLink
                  :to="{ name: 'product-edit', params: { id: product.id } }"
                  class="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
                >
                  Bearbeiten
                </RouterLink>
                <button
                  class="text-xs text-red-500 font-medium hover:text-red-600 transition-colors disabled:opacity-50"
                  :disabled="deletingId === product.id"
                  @click="handleDeleteProduct(product.id)"
                >
                  {{ deletingId === product.id ? 'Löscht …' : 'Löschen' }}
                </button>
              </div>
            </div>
          </li>
        </ul>
        <div v-if="productHasMore" class="mt-4 text-center">
          <button
            :disabled="loadingMore"
            class="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            @click="loadMoreProducts"
          >
            {{ loadingMore ? 'Lädt …' : 'Mehr laden' }}
          </button>
        </div>
      </template>

      <template v-else>
        <p v-if="ratings.length === 0" class="py-12 text-center text-gray-400 text-sm">
          Keine Bewertungen vorhanden.
        </p>
        <ul v-else class="space-y-2">
          <li
            v-for="rating in ratings"
            :key="rating.id"
            class="bg-white rounded-xl border border-gray-100 p-4"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <RouterLink
                  :to="{ name: 'product-detail', params: { id: rating.product.id } }"
                  class="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                >
                  {{ rating.product.name }}
                </RouterLink>
                <p class="text-sm text-gray-500 mt-0.5">
                  von
                  <RouterLink
                    :to="{ name: 'profile-public', params: { id: rating.user_id } }"
                    class="hover:text-primary-600 transition-colors"
                  >
                    {{ rating.profile.username }}
                  </RouterLink>
                  <span
                    v-if="!rating.is_current"
                    class="ml-2 text-xs bg-gray-100 text-gray-400 rounded-full px-1.5 py-0.5"
                  >
                    Veraltet
                  </span>
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <StarDisplay :value="rating.overall" />
                  <span class="text-xs text-gray-400">{{ formatDate(rating.created_at) }}</span>
                </div>
              </div>
              <button
                class="shrink-0 text-xs text-red-500 font-medium hover:text-red-600 transition-colors disabled:opacity-50"
                :disabled="deletingId === rating.id"
                @click="handleDeleteRating(rating.id)"
              >
                {{ deletingId === rating.id ? 'Löscht …' : 'Löschen' }}
              </button>
            </div>
          </li>
        </ul>
        <div v-if="ratingHasMore" class="mt-4 text-center">
          <button
            :disabled="loadingMore"
            class="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            @click="loadMoreRatings"
          >
            {{ loadingMore ? 'Lädt …' : 'Mehr laden' }}
          </button>
        </div>
      </template>
    </template>
  </div>
</template>
