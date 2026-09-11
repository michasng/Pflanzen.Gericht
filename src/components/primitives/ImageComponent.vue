<script setup lang="ts">
defineProps<{ src: string; alt: string; loading?: HTMLImageElement['loading'] }>()
</script>

<template>
  <div class="aspect-square w-full overflow-hidden bg-white">
    <img :src="src" :alt="alt" :loading="loading" class="h-full w-full object-contain" />
  </div>
</template>
