<script setup lang="ts">
import { computed } from 'vue'
import { categoryToLabel } from '@/config/categories'
import { formatDate } from '@/lib/date'
import type { Product } from '@/types'
import Card from '@/components/primitives/CardComponent.vue'

const props = defineProps<{
  product: Pick<Product, 'id' | 'name' | 'category' | 'brand' | 'createdAt'>
  reviewsCount?: number
}>()

const METADATA_SEPARATOR = ' · '

const metadata = computed(() => {
  const createdAt = formatDate(props.product.createdAt)
  if (props.reviewsCount === undefined) return createdAt
  return `${props.reviewsCount} Bewertungen${METADATA_SEPARATOR}${createdAt}`
})
</script>

<template>
  <Card>
    <div class="flex items-start gap-2">
      <slot name="leading" />
      <div class="min-w-0 flex-1">
        <RouterLink
          :to="{ name: 'product-detail', params: { id: product.id } }"
          class="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
        >
          {{ product.name }}
        </RouterLink>
        <p class="text-sm text-gray-500 mt-0.5">
          {{ categoryToLabel(product.category) }}
          <span v-if="product.brand"> · {{ product.brand }}</span>
        </p>
        <p class="text-xs text-gray-400 mt-1">{{ metadata }}</p>
      </div>
    </div>
    <div v-if="$slots.actions" class="flex gap-3 pt-2 border-t border-gray-50 mt-2">
      <slot name="actions" />
    </div>
  </Card>
</template>
