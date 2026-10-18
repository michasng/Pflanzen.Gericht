<script setup lang="ts">
defineProps<{ title?: string; count?: number }>()
</script>

<template>
  <section class="bg-white rounded-2xl border border-gray-100 p-4">
    <div v-if="title || $slots.action" class="flex items-center justify-between mb-2">
      <h3 v-if="title" class="text-base font-bold text-gray-900">
        {{ title }}
        <span v-if="count" class="text-sm font-normal text-gray-400">({{ count }})</span>
      </h3>
      <slot name="action" />
    </div>
    <slot />
  </section>
</template>
