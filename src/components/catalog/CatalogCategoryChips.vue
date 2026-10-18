<script setup lang="ts">
import Chip from '@/components/primitives/ChipComponent.vue'
import { ChipSize } from '@/components/primitives/ChipSize'
import { CATEGORIES, categoryToLabel } from '@/config/categories'

defineProps<{ selected: string | null }>()
defineEmits<{ select: [category: string | null] }>()
</script>

<template>
  <div class="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-4 px-4 scrollbar-none">
    <Chip
      :size="ChipSize.Wide"
      interactive
      :selected="selected === null"
      @click="$emit('select', null)"
    >
      Alle
    </Chip>
    <Chip
      v-for="category in CATEGORIES"
      :key="category"
      :size="ChipSize.Wide"
      interactive
      :selected="selected === category"
      @click="$emit('select', category)"
    >
      {{ categoryToLabel(category) }}
    </Chip>
  </div>
</template>
