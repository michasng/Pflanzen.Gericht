<script lang="ts">
export interface RatingFormValues {
  overall: number
  taste: number | null
  consistency: number | null
  appearance: number | null
  nutrition: number | null
  value: number | null
  comment: string | null
  location: string | null
  price: number | null
  tags: string[]
}
</script>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import StarRatingInput from '@/components/StarRatingInput.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { TAGS, TAG_LABELS, LOCATION_SUGGESTIONS } from '@/config/taxonomy'
import type { Tag } from '@/config/taxonomy'
import type { RatingImage } from '@/types'
import { getImageUrl } from '@/services/catalog'

const CRITERIA_KEYS = ['taste', 'consistency', 'appearance', 'nutrition', 'value'] as const
type CriteriaKey = (typeof CRITERIA_KEYS)[number]
const CRITERIA_LABELS: Record<CriteriaKey, string> = {
  taste: 'Geschmack',
  consistency: 'Konsistenz',
  appearance: 'Aussehen',
  nutrition: 'Nährwerte',
  value: 'Preis-Leistung',
}

const props = withDefaults(
  defineProps<{
    initial?: Partial<RatingFormValues>
    existingImages?: RatingImage[]
    submitting?: boolean
  }>(),
  { existingImages: () => [] },
)

const emit = defineEmits<{
  submit: [values: RatingFormValues]
  filesChanged: [files: File[]]
  deleteImage: [image: RatingImage]
}>()

const overall = ref<number | null>(props.initial?.overall ?? null)

const criteria = reactive<Record<CriteriaKey, number | null>>({
  taste: props.initial?.taste ?? null,
  consistency: props.initial?.consistency ?? null,
  appearance: props.initial?.appearance ?? null,
  nutrition: props.initial?.nutrition ?? null,
  value: props.initial?.value ?? null,
})

const selectedTags = ref<string[]>(props.initial?.tags ? [...props.initial.tags] : [])
const comment = ref(props.initial?.comment ?? '')
const location = ref(props.initial?.location ?? '')
const priceText = ref(
  props.initial?.price != null ? String(props.initial.price).replace('.', ',') : '',
)

function toggleTag(tag: string): void {
  const idx = selectedTags.value.indexOf(tag)
  if (idx >= 0) selectedTags.value.splice(idx, 1)
  else selectedTags.value.push(tag)
}

function handleSubmit(): void {
  if (overall.value === null) return
  const rawPrice = priceText.value.trim()
  const parsedPrice = rawPrice ? parseFloat(rawPrice.replace(',', '.')) : null
  emit('submit', {
    overall: overall.value,
    taste: criteria.taste,
    consistency: criteria.consistency,
    appearance: criteria.appearance,
    nutrition: criteria.nutrition,
    value: criteria.value,
    comment: comment.value.trim() || null,
    location: location.value.trim() || null,
    price: parsedPrice !== null && !isNaN(parsedPrice) ? parsedPrice : null,
    tags: [...selectedTags.value],
  })
}
</script>

<template>
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
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="rf-comment">
        Kommentar
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </label>
      <textarea
        id="rf-comment"
        v-model="comment"
        rows="3"
        maxlength="1000"
        placeholder="Deine Erfahrungen mit dem Produkt …"
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="rf-location">
        Fundort
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </label>
      <input
        id="rf-location"
        v-model="location"
        type="text"
        list="rf-location-suggestions"
        maxlength="80"
        placeholder="z. B. REWE, EDEKA …"
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <datalist id="rf-location-suggestions">
        <option v-for="loc in LOCATION_SUGGESTIONS" :key="loc" :value="loc" />
      </datalist>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="rf-price">
        Preis (€)
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </label>
      <input
        id="rf-price"
        v-model="priceText"
        type="text"
        inputmode="decimal"
        pattern="[0-9]+([.,][0-9]{1,2})?"
        maxlength="8"
        placeholder="z. B. 2,99"
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>

    <div v-if="existingImages.length">
      <p class="text-sm font-medium text-gray-700 mb-2">Vorhandene Fotos</p>
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="img in existingImages"
          :key="img.id"
          class="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
        >
          <img
            :src="getImageUrl('review-images', img.storage_path)"
            alt=""
            class="w-full h-full object-cover"
          />
          <button
            type="button"
            class="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Foto entfernen"
            @click="emit('deleteImage', img)"
          >
            <svg
              class="w-3 h-3"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div>
      <p class="text-sm font-medium text-gray-700 mb-2">
        {{ existingImages.length ? 'Weitere Fotos hinzufügen' : 'Fotos' }}
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </p>
      <ImageUpload @change="emit('filesChanged', $event)" />
    </div>

    <div>
      <button
        type="submit"
        :disabled="submitting || overall === null"
        class="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
      >
        {{ submitting ? 'Wird gespeichert …' : 'Speichern' }}
      </button>
      <p v-if="overall === null" class="mt-2 text-xs text-center text-gray-400">
        Bitte zunächst eine Gesamtbewertung auswählen.
      </p>
    </div>
  </form>
</template>
