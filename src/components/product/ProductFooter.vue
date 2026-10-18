<script setup lang="ts">
import type { ProductSource } from '@/types'
import ProductSources from '@/components/product/ProductSources.vue'

defineProps<{ sources: readonly ProductSource[]; barcode: string | null }>()
</script>

<template>
  <footer
    v-if="sources.length || barcode"
    class="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-gray-100 pt-4"
  >
    <ProductSources :sources="sources" />
    <p v-if="barcode" class="ml-auto text-xs text-gray-500">Barcode: {{ barcode }}</p>
  </footer>
</template>
