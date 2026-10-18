<script setup lang="ts">
import type { ProductSource } from '@/types'
import { formatSourceHostname } from '@/lib/formatSourceHostname'

defineProps<{ sources: readonly ProductSource[] }>()
</script>

<template>
  <p v-if="sources.length" class="text-xs text-gray-500">
    Quellen:
    <template v-for="(source, index) in sources" :key="source.id">
      <span v-if="index > 0">, </span>
      <a
        :href="source.url"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary-600 hover:text-primary-700 underline"
      >
        {{ formatSourceHostname(source.url) }}
      </a>
    </template>
  </p>
</template>
