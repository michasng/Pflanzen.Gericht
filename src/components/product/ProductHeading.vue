<script setup lang="ts">
import type { ProductDetail } from '@/services/catalog'
import { categoryToLabel } from '@/config/categories'
import { baseToLabel } from '@/config/bases'
import { allergenToLabel } from '@/config/allergens'
import { formatQuantity } from '@/lib/formatQuantity'
import { toQuantityUnit } from '@/lib/toQuantityUnit'
import Chip from '@/components/primitives/ChipComponent.vue'
import { ChipSize } from '@/components/primitives/ChipSize'
import { ChipTone } from '@/components/primitives/ChipTone'

defineProps<{
  product: Pick<
    ProductDetail,
    | 'name'
    | 'brand'
    | 'description'
    | 'category'
    | 'base'
    | 'isOrganic'
    | 'allergens'
    | 'quantityUnit'
    | 'quantityValue'
  >
}>()
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-1.5 mb-2">
      <Chip :tone="ChipTone.Primary" :size="ChipSize.Compact">
        {{ categoryToLabel(product.category) }}
      </Chip>
      <Chip v-if="product.base" :tone="ChipTone.Neutral" :size="ChipSize.Compact">
        {{ baseToLabel(product.base) }}
      </Chip>
      <Chip v-if="product.isOrganic" :tone="ChipTone.Success" :size="ChipSize.Compact">Bio</Chip>
      <Chip
        v-for="allergen in product.allergens"
        :key="allergen"
        :tone="ChipTone.Warning"
        :size="ChipSize.Compact"
      >
        {{ allergenToLabel(allergen) }}
      </Chip>
    </div>
    <div class="flex items-start justify-between gap-2 mb-1">
      <h1 class="text-2xl font-bold text-gray-900">
        {{ product.name }},
        {{
          formatQuantity({
            unit: toQuantityUnit(product.quantityUnit),
            value: product.quantityValue,
          })
        }}
      </h1>
      <slot name="actions" />
    </div>
    <p class="text-sm text-gray-500">von {{ product.brand }}</p>
  </div>
</template>
