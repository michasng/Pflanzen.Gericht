<script setup lang="ts">
defineProps<{ message: string | null }>()
</script>

<template>
  <div
    v-if="message"
    role="alert"
    class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
  >
    {{ message }}
  </div>
</template>
