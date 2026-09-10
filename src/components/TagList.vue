<script setup lang="ts">
import ChipComponent from '@/components/ui/ChipComponent.vue'
import { ChipSize } from '@/components/ui/ChipSize'
import { tagToLabel } from '@/config/reviewTags'

defineProps<{ tags: string[] }>()
</script>

<template>
  <div v-if="tags.length" class="flex flex-wrap gap-1">
    <ChipComponent v-for="tag in tags" :key="tag" :size="ChipSize.Compact">{{
      tagToLabel(tag)
    }}</ChipComponent>
  </div>
</template>
