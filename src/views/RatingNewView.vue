<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchProduct } from '@/services/products'
import { createRating, uploadRatingImage } from '@/services/ratings'
import { toErrorMessage } from '@/lib/error'
import StarRatingInput from '@/components/StarRatingInput.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { TAGS, TAG_LABELS, LOCATION_SUGGESTIONS } from '@/config/taxonomy'
import type { Tag } from '@/config/taxonomy'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const product = ref<Product | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)

const overall = ref<number | null>(null)

const CRITERIA_KEYS = ['taste', 'consistency', 'appearance', 'nutrition', 'value'] as const
type CriteriaKey = (typeof CRITERIA_KEYS)[number]

const criteria = reactive<Record<CriteriaKey, number | null>>({
  taste: null,
  consistency: null,
  appearance: null,
  nutrition: null,
  value: null,
})
const CRITERIA_LABELS: Record<CriteriaKey, string> = {
  taste: 'Geschmack',
  consistency: 'Konsistenz',
  appearance: 'Aussehen',
  nutrition: 'Nährwerte',
  value: 'Preis-Leistung',
}
const selectedTags = ref<string[]>([])
const comment = ref('')
const location = ref('')
const price = ref('')
const pendingFiles = ref<File[]>([])

const submitting = ref(false)
const submitError = ref<string | null>(null)

function toggleTag(tag: string): void {
  const idx = selectedTags.value.indexOf(tag)
  if (idx >= 0) selectedTags.value.splice(idx, 1)
  else selectedTags.value.push(tag)
}

onMounted(async () => {
  try {
    product.value = await fetchProduct(route.params.id as string)
    if (!product.value) loadError.value = 'Produkt nicht gefunden.'
  } catch (err) {
    loadError.value = toErrorMessage(err)
  } finally {
    loading.value = false
  }
})

async function handleSubmit(): Promise<void> {
  const user = authStore.user
  if (!product.value || !user || overall.value === null) return
  submitting.value = true
  submitError.value = null
  try {
    const rawPrice = price.value.trim()
    const priceNum = rawPrice ? parseFloat(rawPrice.replace(',', '.')) : null
    const rating = await createRating(
      product.value.id,
      user.id,
      {
        overall: overall.value,
        taste: criteria.taste,
        consistency: criteria.consistency,
        appearance: criteria.appearance,
        nutrition: criteria.nutrition,
        value: criteria.value,
        comment: comment.value.trim() || null,
        location: location.value.trim() || null,
        price: priceNum !== null && !isNaN(priceNum) ? priceNum : null,
      },
      selectedTags.value,
    )
    await Promise.all(
      pendingFiles.value.map((file, i) => uploadRatingImage(rating.id, user.id, file, i)),
    )
    await router.push({ name: 'product-detail', params: { id: product.value.id } })
  } catch (err) {
    submitError.value = toErrorMessage(err)
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <div v-if="loading" class="py-12 text-center text-gray-400 text-sm">Wird geladen …</div>
    <div
      v-else-if="loadError"
      role="alert"
      class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
    >
      {{ loadError }}
    </div>
    <template v-else-if="product">
      <div class="mb-6">
        <p class="text-sm text-gray-500 mb-1">Bewertung für</p>
        <h1 class="text-xl font-bold text-gray-900 leading-tight">{{ product.name }}</h1>
        <p v-if="product.brand" class="text-sm text-gray-500 mt-0.5">{{ product.brand }}</p>
      </div>

      <form class="space-y-6" @submit.prevent="handleSubmit">
        <div>
          <p class="text-sm font-medium text-gray-700 mb-2">
            Gesamtbewertung <span class="text-red-500" aria-hidden="true">*</span>
          </p>
          <StarRatingInput v-model="overall" :required="true" />
        </div>

        <div class="space-y-3">
          <p class="text-sm font-medium text-gray-700">
            Detailbewertungen
            <span class="text-xs text-gray-400 font-normal">(optional)</span>
          </p>
          <div v-for="key in CRITERIA_KEYS" :key="key" class="flex items-center gap-4">
            <span class="text-sm text-gray-600 w-32 shrink-0">{{ CRITERIA_LABELS[key] }}</span>
            <StarRatingInput
              :model-value="criteria[key]"
              @update:model-value="criteria[key] = $event"
            />
          </div>
        </div>

        <div>
          <p class="text-sm font-medium text-gray-700 mb-2">
            Tags
            <span class="text-xs text-gray-400 font-normal">(optional)</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in TAGS"
              :key="tag"
              type="button"
              class="px-3 py-1.5 rounded-full text-sm transition-colors"
              :class="
                selectedTags.includes(tag)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              "
              @click="toggleTag(tag)"
            >
              {{ TAG_LABELS[tag as Tag] }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5" for="rn-comment">
            Kommentar
            <span class="text-xs text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="rn-comment"
            v-model="comment"
            rows="3"
            maxlength="1000"
            placeholder="Deine Erfahrungen mit dem Produkt …"
            class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5" for="rn-location">
            Fundort
            <span class="text-xs text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="rn-location"
            v-model="location"
            type="text"
            list="location-suggestions"
            maxlength="80"
            placeholder="z. B. REWE, EDEKA …"
            class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <datalist id="location-suggestions">
            <option v-for="loc in LOCATION_SUGGESTIONS" :key="loc" :value="loc" />
          </datalist>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5" for="rn-price">
            Preis (€)
            <span class="text-xs text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="rn-price"
            v-model="price"
            type="text"
            inputmode="decimal"
            pattern="[0-9]+([.,][0-9]{1,2})?"
            maxlength="8"
            placeholder="z. B. 2,99"
            class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <p class="text-sm font-medium text-gray-700 mb-2">
            Fotos
            <span class="text-xs text-gray-400 font-normal">(optional)</span>
          </p>
          <ImageUpload @change="pendingFiles = $event" />
        </div>

        <div
          v-if="submitError"
          role="alert"
          class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          {{ submitError }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="submitting || overall === null"
            class="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
          >
            {{ submitting ? 'Wird gespeichert …' : 'Bewertung abgeben' }}
          </button>
          <p v-if="overall === null" class="mt-2 text-xs text-center text-gray-400">
            Bitte zunächst eine Gesamtbewertung auswählen.
          </p>
        </div>
      </form>
    </template>
  </div>
</template>
