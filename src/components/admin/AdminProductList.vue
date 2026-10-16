<script setup lang="ts">
import type { ProductListItem } from '@/services/catalog'
import { useSelection } from '@/composables/useSelection'
import AdminProductCard from '@/components/admin/AdminProductCard.vue'
import LoadMoreButton from '@/components/LoadMoreButton.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'

const MERGEABLE_PRODUCT_COUNT = 2

const props = defineProps<{
  products: ProductListItem[]
  hasMore: boolean
  loadingMore: boolean
  deletingId: string | null
}>()

const emit = defineEmits<{
  delete: [ids: string[]]
  merge: [first: ProductListItem, second: ProductListItem]
  loadMore: []
}>()

const { selectedIds, allSelected, someSelected, setSelected } = useSelection(() => props.products)

const handleDeleteProduct = (id: string): void => {
  if (!confirm('Produkt und alle zugehörigen Bewertungen unwiderruflich löschen?')) return
  emit('delete', [id])
}

const handleDeleteSelectedProducts = (): void => {
  if (!confirm('Ausgewählte Produkte und alle zugehörigen Bewertungen unwiderruflich löschen?'))
    return
  emit('delete', selectedIds.value)
}

const handleMergeProducts = (): void => {
  const [first, second, ...rest] = props.products.filter((product) =>
    selectedIds.value.includes(product.id),
  )
  if (!first || !second || rest.length > 0) return
  emit('merge', first, second)
}
</script>

<template>
  <p v-if="products.length === 0" class="py-12 text-center text-gray-400 text-sm">
    Keine Produkte vorhanden.
  </p>
  <template v-else>
    <div class="mb-3 flex items-center gap-2">
      <label class="mr-auto flex items-center gap-2 pl-4 text-sm text-gray-700">
        <input
          v-model="allSelected"
          type="checkbox"
          :indeterminate="someSelected"
          aria-label="Alle Produkte auswählen"
          class="h-4 w-4 shrink-0 rounded"
        />
        Alle auswählen
      </label>
      <Button
        ariaLabel="Produkte zusammenführen"
        :variant="ButtonVariant.Outlined"
        :size="ButtonSize.Compact"
        :disabled="selectedIds.length !== MERGEABLE_PRODUCT_COUNT"
        @click="handleMergeProducts"
      >
        Zusammenführen
      </Button>
      <Button
        ariaLabel="Ausgewählte Produkte löschen"
        :variant="ButtonVariant.Outlined"
        :size="ButtonSize.Compact"
        :tone="ButtonTone.Danger"
        :disabled="selectedIds.length === 0 || deletingId !== null"
        @click="handleDeleteSelectedProducts"
      >
        Löschen
      </Button>
    </div>
    <ul class="space-y-2">
      <li v-for="product in products" :key="product.id">
        <AdminProductCard
          :product="product"
          :deleting="deletingId === product.id"
          :selected="selectedIds.includes(product.id)"
          @update:selected="(selected) => setSelected(product.id, selected)"
          @delete="handleDeleteProduct(product.id)"
        />
      </li>
    </ul>
  </template>
  <div v-if="hasMore" class="mt-4 text-center">
    <LoadMoreButton
      ariaLabel="Mehr Produkte laden"
      :loading="loadingMore"
      @click="emit('loadMore')"
    />
  </div>
</template>
