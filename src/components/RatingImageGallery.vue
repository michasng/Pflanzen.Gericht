<script setup lang="ts">
import { computed, ref } from 'vue'
import Image from '@/components/primitives/ImageComponent.vue'
import { ImageSize } from '@/config/imageSizes'
import { getImageUrl } from '@/services/catalog'
import type { RatingImage } from '@/types'

const REVIEW_IMAGE_BUCKET = 'review-images'

const props = defineProps<{ images: RatingImage[] }>()

const sortedImages = computed(() =>
  [...props.images].sort(
    (firstImage, secondImage) => firstImage.sort_order - secondImage.sort_order,
  ),
)

const selectedImage = ref<RatingImage | null>(null)

const closeDialog = (): void => {
  selectedImage.value = null
}
</script>

<template>
  <div v-if="sortedImages.length" class="grid grid-cols-4 gap-2">
    <button
      v-for="(image, index) in sortedImages"
      :key="image.id"
      type="button"
      class="overflow-hidden rounded-lg border border-gray-100"
      :aria-label="`Foto ${index + 1} vergrößern`"
      @click="selectedImage = image"
    >
      <Image
        :src="getImageUrl(REVIEW_IMAGE_BUCKET, image.storage_path, ImageSize.Thumbnail)"
        :alt="`Foto ${index + 1}`"
      />
    </button>
  </div>

  <Teleport to="body">
    <div v-if="selectedImage">
      <button
        type="button"
        class="fixed inset-0 z-40 bg-black/60"
        aria-label="Dialog schließen"
        @click="closeDialog"
      ></button>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Foto in voller Größe"
        class="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 sm:mx-auto sm:max-w-md"
      >
        <Image
          :src="getImageUrl(REVIEW_IMAGE_BUCKET, selectedImage.storage_path, ImageSize.Large)"
          alt="Foto in voller Größe"
          class="rounded-2xl"
        />
        <button
          type="button"
          class="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-600 shadow"
          aria-label="Schließen"
          @click="closeDialog"
        >
          ✕
        </button>
      </div>
    </div>
  </Teleport>
</template>
