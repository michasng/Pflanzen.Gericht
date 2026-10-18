<script setup lang="ts">
withDefaults(
  defineProps<{
    productName: string
    brand: string
    label?: string
  }>(),
  { label: 'Bewertung für' },
)
</script>

<template>
  <div class="mb-6">
    <p class="text-sm text-gray-500 mb-1">{{ label }}</p>
    <h1 class="text-xl font-bold text-gray-900 leading-tight">{{ productName }}</h1>
    <p v-if="brand" class="text-sm text-gray-500 mt-0.5">{{ brand }}</p>
  </div>
</template>
