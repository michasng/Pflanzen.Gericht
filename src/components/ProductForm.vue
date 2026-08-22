<script lang="ts">
export interface ProductFormValues {
  name: string
  category: string
  base: string | null
  brand: string | null
  description: string | null
}
</script>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { CATEGORIES, CATEGORY_LABELS, BASES, BASE_LABELS } from '@/config/taxonomy'
import type { Category, Base } from '@/config/taxonomy'
import { searchSimilarProducts } from '@/services/products'
import { getImageUrl } from '@/services/catalog'
import type { Product, ProductImage } from '@/types'

const props = withDefaults(
  defineProps<{
    initial?: Partial<ProductFormValues>
    existingImages?: ProductImage[]
    submitting?: boolean
  }>(),
  { existingImages: () => [] },
)

const emit = defineEmits<{
  submit: [values: ProductFormValues]
  filesChanged: [files: File[]]
  deleteImage: [image: ProductImage]
}>()

const name = ref(props.initial?.name ?? '')
const category = ref(props.initial?.category ?? '')
const base = ref(props.initial?.base ?? '')
const brand = ref(props.initial?.brand ?? '')
const description = ref(props.initial?.description ?? '')

type SimilarProduct = Pick<Product, 'id' | 'name' | 'brand' | 'category'>
const similarProducts = ref<SimilarProduct[]>([])
let dedupeTimer: ReturnType<typeof setTimeout> | undefined

watch(name, (val) => {
  clearTimeout(dedupeTimer)
  if (val.trim().length < 3) {
    similarProducts.value = []
    return
  }
  dedupeTimer = setTimeout(async () => {
    similarProducts.value = await searchSimilarProducts(val)
  }, 500)
})

const handleSubmit = (): void => {
  emit('submit', {
    name: name.value.trim(),
    category: category.value,
    base: base.value || null,
    brand: brand.value.trim() || null,
    description: description.value.trim() || null,
  })
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-name">
        Name <span class="text-red-500" aria-hidden="true">*</span>
      </label>
      <input
        id="pf-name"
        v-model="name"
        type="text"
        required
        minlength="2"
        maxlength="120"
        placeholder="z. B. Alpro Soja-Drink Original"
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <div
        v-if="similarProducts.length"
        class="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm"
      >
        <p class="font-medium text-amber-800 mb-1">Ähnliche Produkte bereits vorhanden:</p>
        <ul class="space-y-1">
          <li v-for="p in similarProducts" :key="p.id">
            <RouterLink
              :to="{ name: 'product-detail', params: { id: p.id } }"
              target="_blank"
              class="text-amber-700 hover:text-amber-900 underline"
            >
              {{ p.name }}<span v-if="p.brand"> ({{ p.brand }})</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-category">
        Kategorie <span class="text-red-500" aria-hidden="true">*</span>
      </label>
      <select
        id="pf-category"
        v-model="category"
        required
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      >
        <option value="" disabled>Bitte wählen …</option>
        <option v-for="cat in CATEGORIES" :key="cat" :value="cat">
          {{ CATEGORY_LABELS[cat as Category] }}
        </option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-base">
        Basis
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </label>
      <select
        id="pf-base"
        v-model="base"
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      >
        <option value="">Keine Angabe</option>
        <option v-for="b in BASES" :key="b" :value="b">
          {{ BASE_LABELS[b as Base] }}
        </option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-brand">
        Marke / Hersteller
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </label>
      <input
        id="pf-brand"
        v-model="brand"
        type="text"
        maxlength="80"
        placeholder="z. B. Alpro"
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-description">
        Beschreibung
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </label>
      <textarea
        id="pf-description"
        v-model="description"
        rows="3"
        maxlength="500"
        placeholder="Kurze Beschreibung des Produkts …"
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
      />
    </div>

    <div v-if="existingImages.length">
      <p class="text-sm font-medium text-gray-700 mb-2">Vorhandene Bilder</p>
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="img in existingImages"
          :key="img.id"
          class="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
        >
          <img
            :src="getImageUrl('product-images', img.storage_path)"
            alt=""
            class="w-full h-full object-cover"
          />
          <button
            type="button"
            class="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Bild entfernen"
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
        {{ existingImages.length ? 'Weitere Bilder hinzufügen' : 'Bilder' }}
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </p>
      <ImageUpload @change="emit('filesChanged', $event)" />
    </div>

    <button
      type="submit"
      :disabled="submitting"
      class="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
    >
      {{ submitting ? 'Wird gespeichert …' : 'Speichern' }}
    </button>
  </form>
</template>
