<script setup lang="ts">
import { computed } from 'vue'
import type { ProductListItem } from '@/services/catalog'
import { useSelection } from '@/composables/useSelection'
import AdminProductRow from '@/components/admin/AdminProductRow.vue'
import LoadMoreButton from '@/components/LoadMoreButton.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'

const MERGEABLE_PRODUCT_COUNT = 2

const props = defineProps<{
  products: ProductListItem[]
  searching: boolean
  hasMore: boolean
  loadingMore: boolean
  deletingId: string | null
}>()

const emit = defineEmits<{
  delete: [ids: string[]]
  merge: [first: ProductListItem, second: ProductListItem]
  loadMore: []
}>()

const { selectedItems, selectedIds, allSelected, someSelected, setSelected, deselectIds } =
  useSelection(() => props.products)

const unselectedProducts = computed(() =>
  props.products.filter((product) => !selectedIds.value.includes(product.id)),
)

const emitDelete = (ids: string[]): void => {
  emit('delete', ids)
  deselectIds(ids)
}

const handleDeleteProduct = (id: string): void => {
  if (!confirm('Produkt und alle zugehörigen Bewertungen unwiderruflich löschen?')) return
  emitDelete([id])
}

const handleDeleteSelectedProducts = (): void => {
  if (!confirm('Ausgewählte Produkte und alle zugehörigen Bewertungen unwiderruflich löschen?'))
    return
  emitDelete(selectedIds.value)
}

const handleMergeProducts = (): void => {
  const [first, second, ...rest] = selectedItems.value
  if (!first || !second || rest.length > 0) return
  emit('merge', first, second)
}
</script>

<template>
  <p
    v-if="products.length === 0 && selectedItems.length === 0"
    class="py-12 text-center text-gray-400 text-sm"
  >
    {{ searching ? 'Keine Produkte gefunden.' : 'Keine Produkte vorhanden.' }}
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
    <section v-if="selectedItems.length > 0" class="mb-4" aria-label="Ausgewählte Produkte">
      <h2 class="mb-2 pl-4 text-sm font-semibold text-gray-700">
        Ausgewählt ({{ selectedItems.length }})
      </h2>
      <ul class="space-y-2">
        <li v-for="product in selectedItems" :key="product.id">
          <AdminProductRow
            :product="product"
            :selected="true"
            :deleting="deletingId === product.id"
            @select="setSelected(product, $event)"
            @delete="handleDeleteProduct(product.id)"
          />
        </li>
      </ul>
    </section>
    <p v-if="products.length === 0" class="py-12 text-center text-gray-400 text-sm">
      Keine Produkte gefunden.
    </p>
    <ul v-else class="space-y-2">
      <li v-for="product in unselectedProducts" :key="product.id">
        <AdminProductRow
          :product="product"
          :selected="false"
          :deleting="deletingId === product.id"
          @select="setSelected(product, $event)"
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
