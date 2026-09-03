<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchProductDetail, getImageUrl, type ProductDetail } from '@/services/catalog'
import { upsertPriceReport, deletePriceReport } from '@/services/prices'
import { deleteProduct } from '@/services/products'
import { formatEuroCents } from '@/lib/price'
import { toErrorMessage } from '@/lib/error'
import StarDisplay from '@/components/StarDisplay.vue'
import RatingCard from '@/components/RatingCard.vue'
import PriceReportForm, { type PriceReportFormValues } from '@/components/PriceReportForm.vue'
import AppLogo from '@/components/AppLogo.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import { categoryToLabel, baseToLabel } from '@/config/taxonomy'
import { formatIngredientLabel, sortIngredientsByPercentageDesc } from '@/config/ingredients'

const route = useRoute()
const router = useRouter()
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

const sortedIngredients = computed(() =>
  sortIngredientsByPercentageDesc(product.value?.ingredients ?? []),
)

const currentRatings = computed(() => product.value?.ratings.filter((r) => r.is_current) ?? [])

type RatingKey = 'taste' | 'consistency' | 'appearance' | 'nutrition' | 'value'

const avgCriteria = (key: RatingKey): number | null => {
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

const priceReports = computed(() => product.value?.priceReports ?? [])
const showPriceForm = ref(false)
const priceFormError = ref<string | null>(null)

const submitPriceReport = async (values: PriceReportFormValues): Promise<void> => {
  const user = authStore.user
  if (!product.value || !user) return
  priceFormError.value = null
  try {
    const updated = await upsertPriceReport(
      product.value.id,
      user.id,
      values.store,
      values.cityName,
      values.priceEuroCents,
      values.salePriceEuroCents,
      values.observedAt,
    )
    const existing = product.value.priceReports.findIndex(
      (r) => r.user_id === user.id && r.store === values.store && r.city_name === values.cityName,
    )
    if (existing >= 0) product.value.priceReports.splice(existing, 1, updated)
    else product.value.priceReports.unshift(updated)
    showPriceForm.value = false
  } catch (err) {
    priceFormError.value = err instanceof Error ? err.message : 'Fehler beim Speichern.'
  }
}

const handleDeleteProduct = async (): Promise<void> => {
  if (
    !product.value ||
    !confirm('Produkt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')
  )
    return
  try {
    await deleteProduct(product.value.id)
    await router.push({ name: 'home' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Fehler beim Löschen.'
  }
}

const removePriceReport = async (id: string): Promise<void> => {
  if (!product.value) return
  try {
    await deletePriceReport(id)
    const idx = product.value.priceReports.findIndex((r) => r.id === id)
    if (idx >= 0) product.value.priceReports.splice(idx, 1)
  } catch (err) {
    priceFormError.value = toErrorMessage(err)
  }
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

    <AlertMessage v-else-if="error" :message="error" />

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
            {{ categoryToLabel(product.category) }}
          </span>
          <span
            v-if="product.base"
            class="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5"
          >
            {{ baseToLabel(product.base) }}
          </span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ product.name }}</h1>
        <p v-if="product.brand" class="text-sm text-gray-500 mb-3">von {{ product.brand }}</p>
        <p v-if="product.description" class="text-sm text-gray-600">{{ product.description }}</p>
      </div>

      <div
        v-if="sortedIngredients.length"
        class="mb-4 bg-white rounded-2xl border border-gray-100 p-4"
      >
        <h2 class="text-base font-bold text-gray-900 mb-2">Zutaten</h2>
        <p class="text-sm text-gray-600">
          <template v-for="(ingredient, index) in sortedIngredients" :key="ingredient.id">
            <span v-if="index > 0">, </span>{{ formatIngredientLabel(ingredient) }}
          </template>
        </p>
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

      <div class="mb-4 bg-white rounded-2xl border border-gray-100 p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-bold text-gray-900">
            Preise
            <span v-if="priceReports.length" class="text-sm font-normal text-gray-400">
              ({{ priceReports.length }})
            </span>
          </h2>
          <button
            v-if="authStore.isLoggedIn && !showPriceForm"
            type="button"
            class="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
            @click="showPriceForm = true"
          >
            + Preis eintragen
          </button>
        </div>

        <PriceReportForm v-if="showPriceForm" @submit="submitPriceReport" />
        <p v-if="priceFormError" role="alert" class="mt-2 text-xs text-red-600">
          {{ priceFormError }}
        </p>

        <p
          v-if="!priceReports.length && !showPriceForm"
          class="text-sm text-gray-400 text-center py-2"
        >
          Noch keine Preise eingetragen.
          <template v-if="!authStore.isLoggedIn">
            <RouterLink
              :to="{ name: 'login', query: { redirect: $route.fullPath } }"
              class="text-primary-600 hover:underline"
            >
              Anmelden
            </RouterLink>
            zum Eintragen.
          </template>
        </p>

        <ul v-if="priceReports.length" class="divide-y divide-gray-50 mt-1">
          <li
            v-for="report in priceReports"
            :key="report.id"
            class="flex items-center justify-between py-2 text-sm"
          >
            <div>
              <span class="font-medium text-gray-800">{{ report.store }}</span>
              <span v-if="report.city_name" class="text-gray-400 ml-1 text-xs">
                · {{ report.city_name }}
              </span>
              <span class="ml-2 font-semibold text-gray-900">
                {{ formatEuroCents(report.effective_price_euro_cents ?? report.price_euro_cents) }}
              </span>
              <span
                v-if="report.sale_price_euro_cents != null"
                class="ml-1 line-through text-gray-400 text-xs"
              >
                {{ formatEuroCents(report.price_euro_cents) }}
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-400">
              <span>{{ report.observed_at }}</span>
              <button
                v-if="authStore.isLoggedIn && report.user_id === authStore.user?.id"
                type="button"
                class="text-red-400 hover:text-red-600 transition-colors"
                aria-label="Eintrag löschen"
                @click="removePriceReport(report.id)"
              >
                ✕
              </button>
            </div>
          </li>
        </ul>
      </div>

      <div class="mb-6 flex flex-col gap-2">
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
        <div
          v-if="
            authStore.isLoggedIn && (product.created_by === authStore.user?.id || authStore.isAdmin)
          "
          class="flex gap-2"
        >
          <RouterLink
            :to="{ name: 'product-edit', params: { id: product.id } }"
            class="flex flex-1 items-center justify-center gap-2 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Bearbeiten
          </RouterLink>
          <button
            type="button"
            class="flex flex-1 items-center justify-center gap-2 py-3 border border-red-100 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
            @click="handleDeleteProduct"
          >
            Löschen
          </button>
        </div>
      </div>

      <div v-if="product.ratings.length">
        <h2 class="text-base font-bold text-gray-900 mb-3">
          Bewertungen ({{ product.ratings.length }})
        </h2>
        <div class="space-y-3">
          <RatingCard
            v-for="rating in product.ratings"
            :key="rating.id"
            :rating="rating"
            :editable="
              authStore.isLoggedIn && rating.user_id === authStore.user?.id && rating.is_current
            "
          />
        </div>
      </div>
    </template>
  </div>
</template>
