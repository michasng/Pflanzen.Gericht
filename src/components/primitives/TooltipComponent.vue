<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ text: string }>()

const tooltipId = useId()
</script>

<template>
  <span class="group relative inline-flex" :aria-describedby="text ? tooltipId : undefined">
    <slot />
    <span
      v-if="text"
      :id="tooltipId"
      role="tooltip"
      class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-pre rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block group-focus-within:block"
    >
      {{ text }}
    </span>
  </span>
</template>
