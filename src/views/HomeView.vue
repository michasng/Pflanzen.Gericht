<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { useCatalogUrlSync } from '@/composables/useCatalogUrlSync'
import ProductCard from '@/components/ProductCard.vue'
import AppLogo from '@/components/AppLogo.vue'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  BASES,
  BASE_LABELS,
  STORE_SUGGESTIONS,
} from '@/config/taxonomy'
import type { Category, Base } from '@/config/taxonomy'
import type { SortOption } from '@/services/catalog'
import { parseEurosToCents } from '@/lib/price'

const catalogStore = useCatalogStore()
useCatalogUrlSync()

const searchInput = ref(catalogStore.search)
let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    catalogStore.setSearch(value)
    catalogStore.load(true)
  }, 300)
})

function selectCategory(cat: string | null): void {
  catalogStore.setCategory(cat)
  catalogStore.load(true)
}

function selectBase(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  catalogStore.setBase(value || null)
  catalogStore.load(true)
}

function selectSort(event: Event): void {
  const value = (event.target as HTMLSelectElement).value as SortOption
  catalogStore.setSort(value)
  catalogStore.load(true)
}

function selectStore(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  catalogStore.setStore(value || null)
  catalogStore.load(true)
}

const minPriceInput = ref('')
const maxPriceInput = ref('')
let priceTimer: ReturnType<typeof setTimeout> | undefined

watch([minPriceInput, maxPriceInput], ([min, max]) => {
  clearTimeout(priceTimer)
  priceTimer = setTimeout(() => {
    catalogStore.setMinPriceCents(parseEurosToCents(min) ?? null)
    catalogStore.setMaxPriceCents(parseEurosToCents(max) ?? null)
    catalogStore.load(true)
  }, 400)
})

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Neueste' },
  { value: 'top_rated', label: 'Beste Bewertung' },
  { value: 'most_rated', label: 'Meiste Bewertungen' },
  { value: 'price_asc', label: 'Günstigste' },
  { value: 'price_desc', label: 'Teuerste' },
]
</script>

<template>
  <div>
    <div class="mb-4 relative">
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <input
        v-model="searchInput"
        type="search"
        placeholder="Vegane Produkte suchen …"
        class="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-4 px-4 scrollbar-none">
      <button
        class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
        :class="
          catalogStore.category === null
            ? 'bg-primary-600 text-white'
            : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
        "
        @click="selectCategory(null)"
      >
        Alle
      </button>
      <button
        v-for="cat in CATEGORIES"
        :key="cat"
        class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
        :class="
          catalogStore.category === cat
            ? 'bg-primary-600 text-white'
            : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
        "
        @click="selectCategory(cat)"
      >
        {{ CATEGORY_LABELS[cat as Category] }}
      </button>
    </div>

    <div class="flex gap-2 mb-5">
      <select
        class="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        :value="catalogStore.base ?? ''"
        @change="selectBase"
      >
        <option value="">Alle Basen</option>
        <option v-for="base in BASES" :key="base" :value="base">
          {{ BASE_LABELS[base as Base] }}
        </option>
      </select>

      <select
        class="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        :value="catalogStore.sort"
        @change="selectSort"
      >
        <option v-for="opt in SORT_OPTIONS" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div class="flex gap-2 mb-5">
      <select
        class="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        :value="catalogStore.store ?? ''"
        @change="selectStore"
      >
        <option value="">Alle Geschäfte</option>
        <option v-for="s in STORE_SUGGESTIONS" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div class="flex gap-2 mb-5">
      <div class="flex-1">
        <label class="block text-xs text-gray-500 mb-1" for="hv-min-price">Preis ab (€)</label>
        <input
          id="hv-min-price"
          v-model="minPriceInput"
          type="text"
          inputmode="decimal"
          maxlength="8"
          placeholder="0,00"
          class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div class="flex-1">
        <label class="block text-xs text-gray-500 mb-1" for="hv-max-price">Preis bis (€)</label>
        <input
          id="hv-max-price"
          v-model="maxPriceInput"
          type="text"
          inputmode="decimal"
          maxlength="8"
          placeholder="z. B. 5,00"
          class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>

    <div
      v-if="catalogStore.error"
      role="alert"
      class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4"
    >
      {{ catalogStore.error }}
    </div>

    <div
      v-if="catalogStore.loading && catalogStore.products.length === 0"
      class="py-20 text-center text-gray-400 text-sm"
    >
      Wird geladen …
    </div>

    <template v-else-if="catalogStore.products.length === 0 && !catalogStore.loading">
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <AppLogo class="w-20 h-20 text-gray-200 mb-4" />
        <p class="text-gray-600 font-semibold text-lg mb-1">Keine Produkte gefunden</p>
        <p class="text-gray-400 text-sm mb-6">
          {{
            catalogStore.search || catalogStore.category || catalogStore.base
              ? 'Versuche einen anderen Filter.'
              : 'Sei der Erste und füge ein veganes Produkt hinzu!'
          }}
        </p>
        <RouterLink
          v-if="!catalogStore.search && !catalogStore.category && !catalogStore.base"
          :to="{ name: 'product-new' }"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Produkt hinzufügen
        </RouterLink>
      </div>
    </template>

    <template v-else>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <ProductCard
          v-for="product in catalogStore.products"
          :key="product.id"
          :product="product"
        />
      </div>

      <div v-if="catalogStore.hasMore" class="mt-6 text-center">
        <button
          :disabled="catalogStore.loading"
          class="px-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          @click="catalogStore.load()"
        >
          {{ catalogStore.loading ? 'Lädt …' : 'Mehr laden' }}
        </button>
      </div>
    </template>
  </div>
</template>
