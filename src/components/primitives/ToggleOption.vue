<script setup lang="ts">
defineProps<{ pressed: boolean; disabled?: boolean }>()
</script>

<template>
  <button
    type="button"
    :aria-pressed="pressed"
    :disabled="disabled"
    class="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 text-left text-sm text-gray-900 hover:border-primary-300 disabled:opacity-50"
  >
    <span class="truncate"><slot /></span>
    <svg
      v-if="pressed"
      class="h-5 w-5 shrink-0 text-primary-600"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </button>
</template>
