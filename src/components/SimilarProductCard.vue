<script setup lang="ts">
import { computed } from 'vue'
import AppLogo from '@/components/AppLogo.vue'
import Image from '@/components/primitives/ImageComponent.vue'
import ProgressBar from '@/components/primitives/ProgressBar.vue'
import { getImageUrl } from '@/services/catalog'
import type { SimilarProduct } from '@/services/similarProducts'

const props = defineProps<{ product: SimilarProduct }>()

defineEmits<{ select: [] }>()

const AGREEMENT_ARIA_LABEL = 'Zustimmung'

const coverUrl = computed(() =>
  props.product.storage_path ? getImageUrl('product-images', props.product.storage_path) : null,
)
const agreementPercent = computed(() => Math.round(props.product.agreement_rate * 100))
const agreementValueText = computed(() => `${agreementPercent.value} % Zustimmung`)
</script>

<template>
  <button
    type="button"
    :aria-label="product.name"
    class="group flex w-full flex-col items-stretch justify-start overflow-hidden rounded-2xl border border-gray-100 bg-white text-left font-medium transition-colors hover:shadow-md"
    @click="$emit('select')"
  >
    <div class="aspect-square bg-gray-50">
      <Image v-if="coverUrl" :src="coverUrl" :alt="product.name" />
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
        <ProgressBar
          :aria-label="AGREEMENT_ARIA_LABEL"
          :aria-valuetext="agreementValueText"
          class="h-2"
          :percent="agreementPercent"
        />
      </div>
    </div>
  </button>
</template>
