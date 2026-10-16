<script setup lang="ts">
import { categoryToLabel } from '@/config/categories'
import type { ProductListItem } from '@/services/catalog'
import { formatDate } from '@/lib/date'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'
import Card from '@/components/primitives/CardComponent.vue'

defineProps<{
  product: ProductListItem
  deleting: boolean
}>()

const selected = defineModel<boolean>('selected', { required: true })

const emit = defineEmits<{
  delete: []
}>()
</script>

<template>
  <Card>
    <div class="flex items-start justify-between gap-2">
      <input
        v-model="selected"
        type="checkbox"
        :aria-label="`${product.name} auswählen`"
        class="mt-1 h-4 w-4 shrink-0 rounded"
      />
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
        <p class="text-xs text-gray-400 mt-0.5">
          {{ product.reviewsCount }} Bewertungen · {{ formatDate(product.createdAt) }}
        </p>
      </div>
      <div class="flex gap-2 shrink-0">
        <RouterLink
          :to="{ name: 'product-edit', params: { id: product.id } }"
          class="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
        >
          Bearbeiten
        </RouterLink>
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
      </div>
    </div>
  </Card>
</template>
