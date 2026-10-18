<script setup lang="ts">
import { computed, ref } from 'vue'
import { injectGateway } from '@/composables/injectGateway'
import { imageUrlGatewayKey } from '@/services/ImageUrlGateway'
import { ImageSize } from '@/config/imageSizes'
import type { ProductImage } from '@/types'
import AppLogo from '@/components/AppLogo.vue'
import Image from '@/components/primitives/ImageComponent.vue'

const props = defineProps<{ images: readonly ProductImage[]; productName: string }>()

const { getImageUrl } = injectGateway(imageUrlGatewayKey)

const activeImageIndex = ref(0)

const sortedImages = computed(() => [...props.images].sort((a, b) => a.sortOrder - b.sortOrder))
const activeImage = computed(() => sortedImages.value[activeImageIndex.value] ?? null)
</script>

<template>
  <div class="-mx-4">
    <div class="aspect-square bg-gray-100">
      <Image
        v-if="activeImage"
        :src="getImageUrl('product-images', activeImage.storagePath, ImageSize.Large)"
        :alt="productName"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <AppLogo class="w-20 h-20 text-gray-200" />
      </div>
    </div>
    <div v-if="sortedImages.length > 1" class="flex gap-1.5 overflow-x-auto px-4 pt-2 pb-1">
      <button
        v-for="(image, index) in sortedImages"
        :key="image.id"
        type="button"
        class="shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors"
        :class="activeImageIndex === index ? 'border-primary-500' : 'border-transparent'"
        :aria-label="`Bild ${index + 1} anzeigen`"
        :aria-pressed="activeImageIndex === index"
        @click="activeImageIndex = index"
      >
        <Image
          :src="getImageUrl('product-images', image.storagePath, ImageSize.Thumbnail)"
          :alt="`Bild ${index + 1}`"
        />
      </button>
    </div>
  </div>
</template>
