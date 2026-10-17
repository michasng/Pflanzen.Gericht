<script setup lang="ts">
import type { ProductSource } from '@/types'
import { formatSourceHostname } from '@/lib/formatSourceHostname'
import SectionCard from '@/components/SectionCard.vue'

defineProps<{ sources: readonly ProductSource[] }>()
</script>

<template>
  <SectionCard v-if="sources.length" title="Quellen">
    <p class="text-sm text-gray-600">
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
  </SectionCard>
</template>
