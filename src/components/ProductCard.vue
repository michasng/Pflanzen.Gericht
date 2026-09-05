<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import StarDisplay from '@/components/StarDisplay.vue'
import AppLogo from '@/components/AppLogo.vue'
import { categoryToLabel } from '@/config/taxonomy'
import { getImageUrl, type ProductListItem } from '@/services/catalog'

const props = defineProps<{ product: ProductListItem }>()

const coverUrl = computed(() => {
  const sorted = [...props.product.images].sort((a, b) => a.sort_order - b.sort_order)
  return sorted[0] ? getImageUrl('product-images', sorted[0].storage_path) : null
})

const categoryLabel = computed(() => categoryToLabel(props.product.category))
</script>

<template>
  <RouterLink
    :to="{ name: 'product-detail', params: { id: product.id } }"
    class="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
  >
    <div class="aspect-square bg-gray-50 overflow-hidden">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="product.name"
        loading="lazy"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <AppLogo class="w-12 h-12 text-gray-200" />
      </div>
    </div>

    <div class="p-3 flex flex-col gap-1">
      <span class="text-xs text-primary-600 font-medium">{{ categoryLabel }}</span>
      <h3 class="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
        {{ product.name }}
      </h3>
      <p v-if="product.brand" class="text-xs text-gray-400 truncate">{{ product.brand }}</p>
      <span
        v-if="product.is_organic"
        class="self-start text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5 font-medium"
      >
        Bio
      </span>
      <div class="flex items-center gap-1.5 mt-0.5">
        <StarDisplay :value="product.avg_overall" />
        <span class="text-xs text-gray-400">
          {{ product.ratings_count > 0 ? `(${product.ratings_count})` : 'Neu' }}
        </span>
      </div>
      <p v-if="product.min_price_euro_cents != null" class="text-xs font-medium text-gray-600">
        ab {{ (product.min_price_euro_cents / 100).toFixed(2).replace('.', ',') }} €
      </p>
    </div>
  </RouterLink>
</template>
