<script setup lang="ts">
import { ref, watch } from 'vue'
import { SEARCH_DEBOUNCE_MILLISECONDS } from '@/config/catalogSearch'

const props = defineProps<{ initialSearch: string }>()
const emit = defineEmits<{ search: [value: string] }>()

const searchInput = ref(props.initialSearch)
let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => emit('search', value), SEARCH_DEBOUNCE_MILLISECONDS)
})
</script>

<template>
  <div class="mb-4 relative">
    <svg
      class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
    <input
      v-model="searchInput"
      type="search"
      placeholder="Vegane Produkte suchen …"
      class="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    />
  </div>
</template>
