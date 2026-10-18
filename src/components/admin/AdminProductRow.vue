<script setup lang="ts">
import type { ProductListItem } from '@/services/catalog'
import ProductSummaryCard from '@/components/ProductSummaryCard.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import ButtonLink from '@/components/primitives/ButtonLink.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'

defineProps<{
  product: ProductListItem
  selected: boolean
  deleting: boolean
}>()

const emit = defineEmits<{
  select: [selected: boolean]
  delete: []
}>()
</script>

<template>
  <ProductSummaryCard :product="product" :reviewsCount="product.reviewsCount">
    <template #leading>
      <input
        type="checkbox"
        :checked="selected"
        :aria-label="`${product.name} auswählen`"
        class="mt-1 h-4 w-4 shrink-0 rounded"
        @change="emit('select', !selected)"
      />
    </template>
    <template #actions>
      <ButtonLink
        :to="{ name: 'product-edit', params: { id: product.id } }"
        :variant="ButtonVariant.Text"
        :size="ButtonSize.Small"
      >
        Bearbeiten
      </ButtonLink>
      <Button
        ariaLabel="Produkt löschen"
        :variant="ButtonVariant.Text"
        :size="ButtonSize.Small"
        :tone="ButtonTone.Danger"
        :disabled="deleting"
        @click="emit('delete')"
      >
        {{ deleting ? 'Löscht …' : 'Löschen' }}
      </Button>
    </template>
  </ProductSummaryCard>
</template>
