<script setup lang="ts">
import { computed } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import Chip from '@/components/primitives/ChipComponent.vue'
import { ChipTone } from '@/components/primitives/ChipTone'
import { CatalogListFilter } from '@/config/CatalogListFilter'
import { CatalogSingleFilter } from '@/config/CatalogSingleFilter'
import { tagToLabel } from '@/config/reviewTags'
import { allergenToLabel } from '@/config/allergens'
import { formatEuroCents } from '@/lib/price'

const catalogStore = useCatalogStore()

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
  <div v-if="catalogStore.activeFilterCount > 0" class="flex flex-wrap gap-2 mb-3">
    <Chip
      v-if="catalogStore.minRating"
      selected
      removable
      remove-label="Min-Bewertung entfernen"
      @remove="catalogStore.clearFilter(CatalogSingleFilter.MinRating)"
    >
      &ge; {{ catalogStore.minRating }} &#9733;
    </Chip>
    <Chip
      v-for="tag in catalogStore.tags"
      :key="tag"
      selected
      removable
      :remove-label="`${tagToLabel(tag)} entfernen`"
      @remove="catalogStore.removeFilterValue(CatalogListFilter.Tags, tag)"
    >
      {{ tagToLabel(tag) }}
    </Chip>
    <Chip
      v-for="ingredientName in catalogStore.includeIngredients"
      :key="`include-${ingredientName}`"
      selected
      removable
      :remove-label="`${ingredientName} entfernen`"
      @remove="catalogStore.removeFilterValue(CatalogListFilter.IncludeIngredients, ingredientName)"
    >
      {{ ingredientName }}
    </Chip>
    <Chip
      v-for="ingredientName in catalogStore.excludeIngredients"
      :key="`exclude-${ingredientName}`"
      :tone="ChipTone.Danger"
      removable
      :remove-label="`ohne ${ingredientName} entfernen`"
      @remove="catalogStore.removeFilterValue(CatalogListFilter.ExcludeIngredients, ingredientName)"
    >
      ohne {{ ingredientName }}
    </Chip>
    <Chip
      v-for="allergen in catalogStore.excludeAllergens"
      :key="`allergen-${allergen}`"
      :tone="ChipTone.Danger"
      removable
      :remove-label="`ohne ${allergenToLabel(allergen)} entfernen`"
      @remove="catalogStore.removeFilterValue(CatalogListFilter.ExcludeAllergens, allergen)"
    >
      ohne {{ allergenToLabel(allergen) }}
    </Chip>
    <Chip
      v-if="catalogStore.organic"
      selected
      removable
      remove-label="Bio-Filter entfernen"
      @remove="catalogStore.clearFilter(CatalogSingleFilter.Organic)"
    >
      Bio
    </Chip>
    <Chip
      v-if="catalogStore.base"
      selected
      removable
      remove-label="Basis entfernen"
      @remove="catalogStore.clearFilter(CatalogSingleFilter.Base)"
    >
      {{ catalogStore.base }}
    </Chip>
    <Chip
      v-if="catalogStore.store"
      selected
      removable
      remove-label="Geschäft entfernen"
      @remove="catalogStore.clearFilter(CatalogSingleFilter.Store)"
    >
      {{ catalogStore.store }}{{ catalogStore.city ? ` · ${catalogStore.city}` : '' }}
    </Chip>
    <Chip
      v-if="priceRangeLabel"
      selected
      removable
      remove-label="Preisfilter entfernen"
      @remove="catalogStore.clearFilter(CatalogSingleFilter.Price)"
    >
      {{ priceRangeLabel }}
    </Chip>
  </div>
</template>
