<script setup lang="ts">
import { computed } from 'vue'
import AppLogo from '@/components/AppLogo.vue'
import ProgressBar from '@/components/primitives/ProgressBar.vue'
import { getImageUrl } from '@/services/catalog'
import type { SimilarProduct } from '@/services/similarProducts'

const props = defineProps<{ product: SimilarProduct }>()

defineEmits<{ select: [] }>()

const coverUrl = computed(() =>
  props.product.storage_path ? getImageUrl('product-images', props.product.storage_path) : null,
)
const agreementPercent = computed(() => Math.round(props.product.agreement_rate * 100))
const voteLabel = computed(
  () => `${props.product.total_count} Stimme${props.product.total_count === 1 ? '' : 'n'}`,
)
</script>

<template>
  <button
    type="button"
    class="group flex w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left transition-shadow hover:shadow-md"
    @click="$emit('select')"
  >
    <div class="aspect-square overflow-hidden bg-gray-50">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="product.name"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div v-else class="flex h-full w-full items-center justify-center">
        <AppLogo class="h-12 w-12 text-gray-200" />
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-2 p-3">
      <div>
        <h3 class="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
          {{ product.name }}
        </h3>
        <p v-if="product.brand" class="truncate text-xs text-gray-400">{{ product.brand }}</p>
      </div>

      <div class="mt-auto">
        <ProgressBar class="mb-1.5 h-2" :percent="agreementPercent" />
        <div class="flex items-center justify-between gap-2 text-xs text-gray-500">
          <span>{{ agreementPercent }} % Zustimmung</span>
          <span>{{ voteLabel }}</span>
        </div>
      </div>
    </div>
  </button>
</template>
