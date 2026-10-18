<script setup lang="ts">
import { injectGateway } from '@/composables/injectGateway'
import { imageUrlGatewayKey } from '@/services/ImageUrlGateway'
import { ImageSize } from '@/config/imageSizes'
import Image from '@/components/primitives/ImageComponent.vue'
import type { ProductImage } from '@/types'

defineProps<{ images: readonly ProductImage[] }>()

const { getImageUrl } = injectGateway(imageUrlGatewayKey)

const acceptedImageIds = defineModel<string[]>({ required: true })
</script>

<template>
  <div>
    <p class="text-sm font-medium text-gray-700 mb-2">Bilder</p>
    <p v-if="!images.length" class="text-sm text-gray-400">Keine Bilder vorhanden.</p>
    <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
      <label
        v-for="(image, index) in images"
        :key="image.id"
        class="relative rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
      >
        <Image
          :src="getImageUrl('product-images', image.storagePath, ImageSize.Thumbnail)"
          alt=""
        />
        <span
          class="absolute bottom-0 inset-x-0 flex items-center gap-1 bg-black/60 px-2 py-1 text-xs text-white"
        >
          <input
            v-model="acceptedImageIds"
            type="checkbox"
            class="h-4 w-4 rounded"
            :value="image.id"
            :aria-label="`Bild ${index + 1} akzeptieren`"
          />
          Akzeptieren
        </span>
      </label>
    </div>
  </div>
</template>
