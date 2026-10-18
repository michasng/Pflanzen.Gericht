<script setup lang="ts">
import { ref } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { useCatalogUrlSync } from '@/composables/useCatalogUrlSync'
import CatalogActiveFilterChips from '@/components/catalog/CatalogActiveFilterChips.vue'
import CatalogCategoryChips from '@/components/catalog/CatalogCategoryChips.vue'
import CatalogResults from '@/components/catalog/CatalogResults.vue'
import CatalogSearchInput from '@/components/catalog/CatalogSearchInput.vue'
import CatalogSortSelect from '@/components/catalog/CatalogSortSelect.vue'
import CatalogFilterSheet from '@/components/CatalogFilterSheet.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import Badge from '@/components/primitives/BadgeComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'

const catalogStore = useCatalogStore()
useCatalogUrlSync()

const filterSheetOpen = ref(false)
</script>

<template>
  <div>
    <CatalogSearchInput :initial-search="catalogStore.search" @search="catalogStore.setSearch" />

    <CatalogCategoryChips :selected="catalogStore.category" @select="catalogStore.setCategory" />

    <div class="flex items-center gap-2 mb-3">
      <Button
        ariaLabel="Filter"
        :variant="ButtonVariant.Outlined"
        :size="ButtonSize.Compact"
        class="relative"
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
        <Badge :count="catalogStore.activeFilterCount" class="absolute -top-1.5 -right-1.5" />
      </Button>

      <CatalogSortSelect :selected="catalogStore.sort" @select="catalogStore.setSort" />
    </div>

    <CatalogActiveFilterChips />

    <CatalogResults />

    <CatalogFilterSheet :open="filterSheetOpen" @close="filterSheetOpen = false" />
  </div>
</template>
