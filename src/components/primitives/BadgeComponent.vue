<script setup lang="ts">
defineProps<{ count: number }>()
</script>

<template>
  <span
    v-if="count > 0"
    class="flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-primary-600 px-0.5 text-[10px] font-bold text-white"
  >
    {{ count }}
  </span>
</template>
