<script setup lang="ts">
defineProps<{ label: string; inputId: string; error?: string | null }>()
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1.5" :for="inputId">{{ label }}</label>
    <slot />
    <p v-if="error" class="mt-1 text-xs text-red-600" role="alert">{{ error }}</p>
  </div>
</template>
