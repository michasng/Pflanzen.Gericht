<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="text-center py-4">
    <div class="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
      <svg
        class="w-6 h-6 text-green-600"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    </div>
    <h1 class="text-xl font-bold text-gray-900 mb-2">{{ title }}</h1>
    <p class="text-sm text-gray-500 mb-6"><slot /></p>
    <slot name="action" />
  </div>
</template>
