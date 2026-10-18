<script setup lang="ts">
import { SORT_OPTIONS, SORT_OPTION_LABELS, type SortOption } from '@/config/sortOptions'

defineProps<{ selected: SortOption }>()
const emit = defineEmits<{ select: [sort: SortOption] }>()

const selectSort = (event: Event): void => {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return
  const sort = SORT_OPTIONS.find((option) => option === target.value)
  if (sort) emit('select', sort)
}
</script>

<template>
  <select
    class="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
    :value="selected"
    @change="selectSort"
  >
    <option v-for="option in SORT_OPTIONS" :key="option" :value="option">
      {{ SORT_OPTION_LABELS[option] }}
    </option>
  </select>
</template>
