<script setup lang="ts">
import ComparisonSideCard from '@/components/ComparisonSideCard.vue'
import { ComparisonSide } from '@/types/ComparisonSide'

defineProps<{
  comparing: boolean
  valueA: string
  valueB: string
}>()

defineEmits<{ acceptA: []; acceptB: [] }>()
</script>

<template>
  <slot v-if="!comparing" />
  <div v-else class="grid gap-2 md:grid-cols-3 md:items-start">
    <ComparisonSideCard
      class="order-1"
      :side="ComparisonSide.A"
      :value="valueA"
      @accept="$emit('acceptA')"
    />
    <div class="order-3 md:order-2">
      <slot />
    </div>
    <ComparisonSideCard
      class="order-2 md:order-3"
      :side="ComparisonSide.B"
      :value="valueB"
      @accept="$emit('acceptB')"
    />
  </div>
</template>
