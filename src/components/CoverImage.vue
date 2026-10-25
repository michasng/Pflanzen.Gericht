<script setup lang="ts">
import { computed } from 'vue'
import Image from '@/components/primitives/ImageComponent.vue'
import { ImageSize } from '@/config/imageSizes'
import { injectGateway } from '@/composables/injectGateway'
import type { CoverImageSource } from '@/lib/CoverImageSource'
import { imageUrlGatewayKey } from '@/services/ImageUrlGateway'

const props = defineProps<{
  source: CoverImageSource | null
  alt: string
}>()

// Thumbnail (160px) stays sharp at 2x for the 64px square.
const COVER_IMAGE_VARIANT = ImageSize.Thumbnail

const { getImageUrl } = injectGateway(imageUrlGatewayKey)

const url = computed(() =>
  props.source
    ? getImageUrl(props.source.bucket, props.source.storagePath, COVER_IMAGE_VARIANT)
    : null,
)
</script>

<template>
  <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
    <Image v-if="url" :src="url" :alt="alt" loading="lazy" />
    <span v-else class="flex h-full w-full items-center justify-center text-gray-400">
      <slot />
    </span>
  </div>
</template>
