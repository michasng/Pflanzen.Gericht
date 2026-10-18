<script setup lang="ts">
import { computed } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import Grid from '@/components/primitives/GridComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'

const catalogStore = useCatalogStore()

const isFiltered = computed(
  () => !!catalogStore.search || !!catalogStore.category || catalogStore.activeFilterCount > 0,
)
</script>

<template>
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
        isFiltered
          ? 'Versuche einen anderen Filter.'
          : 'Sei der Erste und füge ein veganes Produkt hinzu!'
      "
    >
      <template #action>
        <RouterLink
          v-if="!isFiltered"
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
    <Grid
      class="transition-opacity duration-150"
      :class="{ 'opacity-50 pointer-events-none': catalogStore.loading }"
    >
      <ProductCard v-for="product in catalogStore.products" :key="product.id" :product="product" />
    </Grid>

    <div v-if="catalogStore.hasMore" class="mt-6 text-center">
      <Button
        ariaLabel="Mehr laden"
        :variant="ButtonVariant.Outlined"
        :size="ButtonSize.Large"
        :disabled="catalogStore.loading"
        @click="catalogStore.load()"
      >
        {{ catalogStore.loading ? 'Lädt …' : 'Mehr laden' }}
      </Button>
    </div>
  </template>
</template>
