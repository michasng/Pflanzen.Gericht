<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ username: string; displayName: string | null }>()

const initial = computed(() => props.username.charAt(0).toUpperCase())
</script>

<template>
  <div class="flex items-center gap-4 pt-2">
    <div
      class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold shrink-0"
      aria-hidden="true"
    >
      {{ initial }}
    </div>
    <div class="min-w-0">
      <p class="font-bold text-gray-900 text-lg leading-tight truncate">
        {{ displayName || username }}
      </p>
      <p v-if="displayName" class="text-sm text-gray-500 truncate">@{{ username }}</p>
      <p class="text-xs text-gray-400 mt-0.5"><slot name="subtitle" /></p>
    </div>
  </div>
</template>
