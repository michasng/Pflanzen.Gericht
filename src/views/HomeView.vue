<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { useCatalogUrlSync } from '@/composables/useCatalogUrlSync'
import ProductCard from '@/components/ProductCard.vue'
import CatalogFilterSheet from '@/components/CatalogFilterSheet.vue'
import AppLogo from '@/components/AppLogo.vue'
import { CATEGORIES, CATEGORY_LABELS, TAG_LABELS } from '@/config/taxonomy'
import type { Category, Tag } from '@/config/taxonomy'
import type { SortOption } from '@/services/catalog'

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

const selectCategory = (cat: string | null): void => {
  catalogStore.setCategory(cat)
  catalogStore.load(true)
}

const selectSort = (event: Event): void => {
  const value = (event.target as HTMLSelectElement).value as SortOption
  catalogStore.setSort(value)
  catalogStore.load(true)
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Neueste' },
  { value: 'top_rated', label: 'Beste Bewertung' },
  { value: 'most_rated', label: 'Meiste Bewertungen' },
  { value: 'price_asc', label: 'Günstigste' },
  { value: 'price_desc', label: 'Teuerste' },
]

const filterSheetOpen = ref(false)

const removeTag = (tag: string): void => {
  catalogStore.setTags(catalogStore.tags.filter((t) => t !== tag))
  catalogStore.load(true)
}

const clearMinRating = (): void => {
  catalogStore.setMinRating(null)
  catalogStore.load(true)
}

const clearBase = (): void => {
  catalogStore.setBase(null)
  catalogStore.load(true)
}

const clearStore = (): void => {
  catalogStore.setStore(null)
  catalogStore.setCity(null)
  catalogStore.load(true)
}

const clearPrice = (): void => {
  catalogStore.setMinPriceCents(null)
  catalogStore.setMaxPriceCents(null)
  catalogStore.load(true)
}
</script>

<template>
  <div>
    <!-- Search -->
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

    <!-- Category pills -->
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

    <!-- Filter button + sort -->
    <div class="flex items-center gap-2 mb-3">
      <button
        type="button"
        class="relative flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-primary-300 transition-colors"
        @click="filterSheetOpen = true"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
          />
        </svg>
        Filter
        <span
          v-if="catalogStore.activeFilterCount > 0"
          class="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold px-0.5"
          >{{ catalogStore.activeFilterCount }}</span
        >
      </button>

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

    <!-- Active filter chips -->
    <div v-if="catalogStore.activeFilterCount > 0" class="flex flex-wrap gap-2 mb-3">
      <span
        v-if="catalogStore.minRating"
        class="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
      >
        ≥ {{ catalogStore.minRating }} ★
        <button type="button" aria-label="Min-Bewertung entfernen" @click="clearMinRating">
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </span>
      <span
        v-for="tag in catalogStore.tags"
        :key="tag"
        class="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
      >
        {{ TAG_LABELS[tag as Tag] }}
        <button
          type="button"
          :aria-label="`${TAG_LABELS[tag as Tag]} entfernen`"
          @click="removeTag(tag)"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </span>
      <span
        v-if="catalogStore.base"
        class="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
      >
        {{ catalogStore.base }}
        <button type="button" aria-label="Basis entfernen" @click="clearBase">
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </span>
      <span
        v-if="catalogStore.store"
        class="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
      >
        {{ catalogStore.store }}{{ catalogStore.city ? ` · ${catalogStore.city}` : '' }}
        <button type="button" aria-label="Geschäft entfernen" @click="clearStore">
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </span>
      <span
        v-if="catalogStore.minPriceCents != null || catalogStore.maxPriceCents != null"
        class="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
      >
        {{
          catalogStore.minPriceCents != null && catalogStore.maxPriceCents != null
            ? `${(catalogStore.minPriceCents / 100).toFixed(2).replace('.', ',')} – ${(catalogStore.maxPriceCents / 100).toFixed(2).replace('.', ',')} €`
            : catalogStore.minPriceCents != null
              ? `ab ${(catalogStore.minPriceCents / 100).toFixed(2).replace('.', ',')} €`
              : `bis ${(catalogStore.maxPriceCents! / 100).toFixed(2).replace('.', ',')} €`
        }}
        <button type="button" aria-label="Preisfilter entfernen" @click="clearPrice">
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </span>
    </div>

    <!-- Result count -->
    <p
      v-if="!catalogStore.loading || catalogStore.products.length > 0"
      class="text-xs text-gray-400 mb-4"
    >
      {{ catalogStore.totalCount }} Produkt{{ catalogStore.totalCount !== 1 ? 'e' : '' }}
    </p>

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
            catalogStore.search || catalogStore.category || catalogStore.activeFilterCount
              ? 'Versuche einen anderen Filter.'
              : 'Sei der Erste und füge ein veganes Produkt hinzu!'
          }}
        </p>
        <RouterLink
          v-if="!catalogStore.search && !catalogStore.category && !catalogStore.activeFilterCount"
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
      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 transition-opacity duration-150"
        :class="{ 'opacity-50 pointer-events-none': catalogStore.loading }"
      >
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

    <CatalogFilterSheet :open="filterSheetOpen" @close="filterSheetOpen = false" />
  </div>
</template>
