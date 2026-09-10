<script setup lang="ts">
import AppLogo from '@/components/AppLogo.vue'

defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 text-center">
    <slot name="icon">
      <AppLogo class="mb-4 h-20 w-20 text-gray-200" />
    </slot>
    <p class="mb-1 text-lg font-semibold text-gray-600">{{ title }}</p>
    <p v-if="description" class="mb-6 text-sm text-gray-400">{{ description }}</p>
    <slot name="action" />
  </div>
</template>
