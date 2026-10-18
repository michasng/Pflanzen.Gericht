<script setup lang="ts">
defineProps<{ reviewsCount: number; productsCount: number }>()
</script>

<template>
  <div class="flex gap-6 py-3 border-t border-b border-gray-100">
    <div class="text-center">
      <p class="text-xl font-bold text-gray-900">{{ reviewsCount }}</p>
      <p class="text-xs text-gray-500">Bewertungen</p>
    </div>
    <div class="text-center">
      <p class="text-xl font-bold text-gray-900">{{ productsCount }}</p>
      <p class="text-xs text-gray-500">Produkte</p>
    </div>
  </div>
</template>
