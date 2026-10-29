<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import StarDisplay from '@/components/StarDisplay.vue'
import AppLogo from '@/components/AppLogo.vue'
import Image from '@/components/primitives/ImageComponent.vue'
import ProductBookmarkControl from '@/components/product/ProductBookmarkControl.vue'
import { categoryToLabel } from '@/config/categories'
import { ImageSize } from '@/config/imageSizes'
import { injectGateway } from '@/composables/injectGateway'
import type { ProductListItem } from '@/services/catalog'
import { imageUrlGatewayKey } from '@/services/ImageUrlGateway'
import { formatQuantity } from '@/lib/formatQuantity'
import { toQuantityUnit } from '@/lib/toQuantityUnit'

const props = defineProps<{ product: ProductListItem; currentUserId: string | null }>()

const { getImageUrl } = injectGateway(imageUrlGatewayKey)

const coverUrl = computed(() => {
  const sorted = [...props.product.images].sort((a, b) => a.sortOrder - b.sortOrder)
  return sorted[0] ? getImageUrl('product-images', sorted[0].storagePath, ImageSize.Preview) : null
})

const categoryLabel = computed(() => categoryToLabel(props.product.category))

const quantityLabel = computed(() =>
  formatQuantity({
    unit: toQuantityUnit(props.product.quantityUnit),
    value: props.product.quantityValue,
  }),
)
</script>

<template>
  <div
    class="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
  >
    <RouterLink
      :to="{ name: 'product-detail', params: { id: product.id } }"
      class="flex flex-1 flex-col"
    >
      <div class="aspect-square bg-gray-50">
        <Image v-if="coverUrl" :src="coverUrl" :alt="product.name" />
        <div v-else class="w-full h-full flex items-center justify-center">
          <AppLogo class="w-12 h-12 text-gray-200" />
        </div>
      </div>

      <div class="p-3 flex flex-col gap-1">
        <span class="text-xs text-primary-600 font-medium">{{ categoryLabel }}</span>
        <h3 class="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
          {{ product.name }}, {{ quantityLabel }}
        </h3>
        <p v-if="product.brand" class="text-xs text-gray-400 truncate">{{ product.brand }}</p>
        <div class="flex items-center gap-1.5 mt-0.5">
          <StarDisplay :value="product.avgOverall" />
          <span class="text-xs text-gray-400">
            {{ product.reviewsCount > 0 ? `(${product.reviewsCount})` : 'Neu' }}
          </span>
        </div>
        <p v-if="product.minPriceEuroCents != null" class="text-xs font-medium text-gray-600">
          ab {{ (product.minPriceEuroCents / 100).toFixed(2).replace('.', ',') }} €
        </p>
      </div>
    </RouterLink>

    <div class="absolute top-2 right-2 rounded-full bg-white/90">
      <ProductBookmarkControl :product-id="product.id" :current-user-id="currentUserId" />
    </div>
  </div>
</template>
