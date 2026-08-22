<script setup lang="ts">
import { tagToLabel } from '@/config/taxonomy'

defineProps<{ tags: string[] }>()
</script>

<template>
  <div v-if="tags.length" class="flex flex-wrap gap-1">
    <span
      v-for="tag in tags"
      :key="tag"
      class="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
    >
      {{ tagToLabel(tag) }}
    </span>
  </div>
</template>
