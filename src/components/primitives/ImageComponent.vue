<script setup lang="ts">
defineProps<{ src: string; alt: string }>()
</script>

<template>
  <div class="aspect-square w-full overflow-hidden bg-white">
    <img :src="src" :alt="alt" class="h-full w-full object-contain" />
  </div>
</template>
