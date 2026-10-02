<script setup lang="ts">
import { ref } from 'vue'
import Image from '@/components/primitives/ImageComponent.vue'
import { ImageSize } from '@/config/imageSizes'
import { getImageUrl } from '@/services/catalog'
import type { ImageCopyGroup } from '@/types/ImageCopyGroup'

defineProps<{ title: string; bucket: string; groups: ImageCopyGroup[] }>()

const emit = defineEmits<{ change: [selectedIds: string[]] }>()

const selectedIds = ref<string[]>([])

const isSelected = (id: string): boolean => selectedIds.value.includes(id)

const toggle = (id: string): void => {
  selectedIds.value = isSelected(id)
    ? selectedIds.value.filter((selectedId) => selectedId !== id)
    : [...selectedIds.value, id]
  emit('change', selectedIds.value)
}
</script>

<template>
  <div v-if="groups.length" class="space-y-3">
    <p class="text-sm font-medium text-gray-700">{{ title }}</p>
    <div v-for="(group, groupIndex) in groups" :key="group.images[0]?.id ?? group.label">
      <p class="text-xs text-gray-500 mb-1">{{ group.label }}</p>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="(img, imageIndex) in group.images"
          :key="img.id"
          type="button"
          class="relative rounded-lg overflow-hidden bg-gray-100 ring-2 transition-shadow"
          :class="isSelected(img.id) ? 'ring-primary-500' : 'ring-transparent'"
          :aria-pressed="isSelected(img.id)"
          :aria-label="`Bild ${imageIndex + 1} aus Gruppe ${groupIndex + 1} (${group.label}) auswählen`"
          @click="toggle(img.id)"
        >
          <Image :src="getImageUrl(bucket, img.storagePath, ImageSize.Thumbnail)" alt="" />
          <span
            v-if="isSelected(img.id)"
            class="absolute top-1 right-1 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs"
            aria-hidden="true"
          >
            ✓
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
