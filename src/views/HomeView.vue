<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { useCatalogUrlSync } from '@/composables/useCatalogUrlSync'
import ProductCard from '@/components/ProductCard.vue'
import CatalogFilterSheet from '@/components/CatalogFilterSheet.vue'
import ChipComponent from '@/components/ui/ChipComponent.vue'
import BadgeComponent from '@/components/ui/BadgeComponent.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import GridComponent from '@/components/ui/GridComponent.vue'
import { CATEGORIES, categoryToLabel } from '@/config/categories'
import { tagToLabel } from '@/config/reviewTags'
import { allergenToLabel } from '@/config/allergens'
import { SORT_OPTIONS, SORT_OPTION_LABELS, type SortOption } from '@/config/sortOptions'
import { formatEuroCents } from '@/lib/price'

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

const SORT_SELECT_OPTIONS: { value: SortOption; label: string }[] = SORT_OPTIONS.map((value) => ({
  value,
  label: SORT_OPTION_LABELS[value],
}))

const filterSheetOpen = ref(false)

const removeTag = (tag: string): void => {
  catalogStore.setTags(catalogStore.tags.filter((t) => t !== tag))
  catalogStore.load(true)
}

const removeIncludeIngredient = (name: string): void => {
  catalogStore.setIncludeIngredients(catalogStore.includeIngredients.filter((n) => n !== name))
  catalogStore.load(true)
}

const removeExcludeIngredient = (name: string): void => {
  catalogStore.setExcludeIngredients(catalogStore.excludeIngredients.filter((n) => n !== name))
  catalogStore.load(true)
}

const removeExcludeAllergen = (allergen: string): void => {
  catalogStore.setExcludeAllergens(catalogStore.excludeAllergens.filter((a) => a !== allergen))
  catalogStore.load(true)
}

const clearOrganic = (): void => {
  catalogStore.setOrganic(false)
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

const priceRangeLabel = computed(() => {
  const { minPriceCents, maxPriceCents } = catalogStore
  if (minPriceCents != null && maxPriceCents != null) {
    return `${formatEuroCents(minPriceCents)} – ${formatEuroCents(maxPriceCents)}`
  }
  if (minPriceCents != null) return `ab ${formatEuroCents(minPriceCents)}`
  if (maxPriceCents != null) return `bis ${formatEuroCents(maxPriceCents)}`
  return null
})
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
      <ChipComponent
        interactive
        :selected="catalogStore.category === null"
        @click="selectCategory(null)"
      >
        Alle
      </ChipComponent>
      <ChipComponent
        v-for="cat in CATEGORIES"
        :key="cat"
        interactive
        :selected="catalogStore.category === cat"
        @click="selectCategory(cat)"
      >
        {{ categoryToLabel(cat) }}
      </ChipComponent>
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
        <BadgeComponent
          :count="catalogStore.activeFilterCount"
          class="absolute -top-1.5 -right-1.5"
        />
      </button>

      <select
        class="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        :value="catalogStore.sort"
        @change="selectSort"
      >
        <option v-for="opt in SORT_SELECT_OPTIONS" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Active filter chips -->
    <div v-if="catalogStore.activeFilterCount > 0" class="flex flex-wrap gap-2 mb-3">
      <ChipComponent
        v-if="catalogStore.minRating"
        selected
        removable
        remove-label="Min-Bewertung entfernen"
        @remove="clearMinRating"
      >
        &ge; {{ catalogStore.minRating }} &#9733;
      </ChipComponent>
      <ChipComponent
        v-for="tag in catalogStore.tags"
        :key="tag"
        selected
        removable
        :remove-label="`${tagToLabel(tag)} entfernen`"
        @remove="removeTag(tag)"
      >
        {{ tagToLabel(tag) }}
      </ChipComponent>
      <ChipComponent
        v-for="ingredientName in catalogStore.includeIngredients"
        :key="`include-${ingredientName}`"
        selected
        removable
        :remove-label="`${ingredientName} entfernen`"
        @remove="removeIncludeIngredient(ingredientName)"
      >
        {{ ingredientName }}
      </ChipComponent>
      <ChipComponent
        v-for="ingredientName in catalogStore.excludeIngredients"
        :key="`exclude-${ingredientName}`"
        removable
        :remove-label="`ohne ${ingredientName} entfernen`"
        @remove="removeExcludeIngredient(ingredientName)"
      >
        ohne {{ ingredientName }}
      </ChipComponent>
      <ChipComponent
        v-for="allergen in catalogStore.excludeAllergens"
        :key="`allergen-${allergen}`"
        removable
        :remove-label="`ohne ${allergenToLabel(allergen)} entfernen`"
        @remove="removeExcludeAllergen(allergen)"
      >
        ohne {{ allergenToLabel(allergen) }}
      </ChipComponent>
      <ChipComponent
        v-if="catalogStore.organic"
        selected
        removable
        remove-label="Bio-Filter entfernen"
        @remove="clearOrganic"
      >
        Bio
      </ChipComponent>
      <ChipComponent
        v-if="catalogStore.base"
        selected
        removable
        remove-label="Basis entfernen"
        @remove="clearBase"
      >
        {{ catalogStore.base }}
      </ChipComponent>
      <ChipComponent
        v-if="catalogStore.store"
        selected
        removable
        remove-label="Geschäft entfernen"
        @remove="clearStore"
      >
        {{ catalogStore.store }}{{ catalogStore.city ? ` · ${catalogStore.city}` : '' }}
      </ChipComponent>
      <ChipComponent
        v-if="priceRangeLabel"
        selected
        removable
        remove-label="Preisfilter entfernen"
        @remove="clearPrice"
      >
        {{ priceRangeLabel }}
      </ChipComponent>
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
      <EmptyState
        title="Keine Produkte gefunden"
        :description="
          catalogStore.search || catalogStore.category || catalogStore.activeFilterCount
            ? 'Versuche einen anderen Filter.'
            : 'Sei der Erste und füge ein veganes Produkt hinzu!'
        "
      >
        <template #action>
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
        </template>
      </EmptyState>
    </template>

    <template v-else>
      <GridComponent
        class="transition-opacity duration-150"
        :class="{ 'opacity-50 pointer-events-none': catalogStore.loading }"
      >
        <ProductCard
          v-for="product in catalogStore.products"
          :key="product.id"
          :product="product"
        />
      </GridComponent>

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
