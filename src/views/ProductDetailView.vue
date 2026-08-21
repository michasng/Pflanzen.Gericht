<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchProductDetail, getImageUrl, type ProductDetail } from '@/services/catalog'
import StarDisplay from '@/components/StarDisplay.vue'
import RatingCard from '@/components/RatingCard.vue'
import AppLogo from '@/components/AppLogo.vue'
import { CATEGORY_LABELS, BASE_LABELS } from '@/config/taxonomy'
import type { Category, Base } from '@/config/taxonomy'

const route = useRoute()
const authStore = useAuthStore()

const product = ref<ProductDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const notFound = ref(false)
const activeImageIndex = ref(0)

const images = computed(() =>
  [...(product.value?.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
)

const activeImage = computed(() => images.value[activeImageIndex.value] ?? null)

const currentRatings = computed(() => product.value?.ratings.filter((r) => r.is_current) ?? [])

type RatingKey = 'taste' | 'consistency' | 'appearance' | 'nutrition' | 'value'

function avgCriteria(key: RatingKey): number | null {
  const vals = currentRatings.value.map((r) => r[key]).filter((v): v is number => v !== null)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

const criteriaAverages = computed(() =>
  (
    [
      ['Geschmack', 'taste'],
      ['Konsistenz', 'consistency'],
      ['Aussehen', 'appearance'],
      ['Nährwerte', 'nutrition'],
      ['Preis-Leistung', 'value'],
    ] as [string, RatingKey][]
  )
    .map(([label, key]) => ({ label, value: avgCriteria(key) }))
    .filter((c): c is { label: string; value: number } => c.value !== null),
)

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat as Category] ?? cat
}

function baseLabel(base: string): string {
  return BASE_LABELS[base as Base] ?? base
}

onMounted(async () => {
  const id = route.params.id as string
  try {
    const data = await fetchProductDetail(id)
    if (!data) notFound.value = true
    else product.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Produkt konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div v-if="loading" class="py-20 text-center text-gray-400 text-sm">Wird geladen …</div>

    <div v-else-if="notFound" class="py-20 text-center">
      <p class="font-semibold text-gray-600 mb-2">Produkt nicht gefunden.</p>
      <RouterLink :to="{ name: 'home' }" class="text-sm text-primary-600 hover:underline">
        Zurück zur Übersicht
      </RouterLink>
    </div>

    <div
      v-else-if="error"
      role="alert"
      class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
    >
      {{ error }}
    </div>

    <template v-else-if="product">
      <div class="-mx-4 mb-4">
        <div class="aspect-video bg-gray-100 overflow-hidden">
          <img
            v-if="activeImage"
            :src="getImageUrl('product-images', activeImage.storage_path)"
            :alt="product.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <AppLogo class="w-20 h-20 text-gray-200" />
          </div>
        </div>
        <div v-if="images.length > 1" class="flex gap-1.5 overflow-x-auto px-4 pt-2 pb-1">
          <button
            v-for="(img, i) in images"
            :key="img.id"
            class="shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors"
            :class="activeImageIndex === i ? 'border-primary-500' : 'border-transparent'"
            @click="activeImageIndex = i"
          >
            <img
              :src="getImageUrl('product-images', img.storage_path)"
              :alt="`Bild ${i + 1}`"
              class="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>

      <div class="mb-5">
        <div class="flex flex-wrap gap-1.5 mb-2">
          <span
            class="text-xs bg-primary-50 text-primary-700 rounded-full px-2.5 py-0.5 font-medium"
          >
            {{ categoryLabel(product.category) }}
          </span>
          <span
            v-if="product.base"
            class="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5"
          >
            {{ baseLabel(product.base) }}
          </span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ product.name }}</h1>
        <p v-if="product.brand" class="text-sm text-gray-500 mb-3">von {{ product.brand }}</p>
        <p v-if="product.description" class="text-sm text-gray-600">{{ product.description }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <p v-if="product.ratings_count === 0" class="text-sm text-gray-400 text-center py-2">
          Noch keine Bewertungen — sei der Erste!
        </p>
        <template v-else>
          <div class="flex items-center gap-4 mb-4">
            <span class="text-4xl font-bold text-gray-900 tabular-nums">
              {{ product.avg_overall?.toFixed(1) }}
            </span>
            <div>
              <StarDisplay :value="product.avg_overall" size="md" />
              <p class="text-xs text-gray-400 mt-0.5">
                {{ product.ratings_count }}
                Bewertung{{ product.ratings_count !== 1 ? 'en' : '' }}
              </p>
            </div>
          </div>

          <div v-if="criteriaAverages.length" class="space-y-2">
            <div v-for="c in criteriaAverages" :key="c.label" class="flex items-center gap-3">
              <span class="text-xs text-gray-500 w-28 shrink-0">{{ c.label }}</span>
              <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-amber-400 rounded-full transition-all"
                  :style="{ width: `${(c.value / 5) * 100}%` }"
                />
              </div>
              <span class="text-xs font-medium text-gray-600 w-6 text-right tabular-nums">
                {{ c.value.toFixed(1) }}
              </span>
            </div>
          </div>
        </template>
      </div>

      <div class="mb-6">
        <RouterLink
          v-if="authStore.isLoggedIn"
          :to="{ name: 'rating-new', params: { id: product.id } }"
          class="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          Produkt bewerten
        </RouterLink>
        <RouterLink
          v-else
          :to="{ name: 'login', query: { redirect: $route.fullPath } }"
          class="flex items-center justify-center gap-2 w-full py-3 border border-primary-600 text-primary-600 rounded-xl font-medium hover:bg-primary-50 transition-colors"
        >
          Anmelden zum Bewerten
        </RouterLink>
      </div>

      <div v-if="product.ratings.length">
        <h2 class="text-base font-bold text-gray-900 mb-3">
          Bewertungen ({{ product.ratings.length }})
        </h2>
        <div class="space-y-3">
          <RatingCard v-for="rating in product.ratings" :key="rating.id" :rating="rating" />
        </div>
      </div>
    </template>
  </div>
</template>
