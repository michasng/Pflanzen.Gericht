<script setup lang="ts">
interface ReviewScoreDimension {
  label: string
  value: number
}

defineProps<{
  scores: ReviewScoreDimension[]
}>()
</script>

<template>
  <div class="space-y-2">
    <div v-for="score in scores" :key="score.label" class="flex items-center gap-3">
      <span class="w-28 shrink-0 text-xs text-gray-500">{{ score.label }}</span>
      <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          class="h-full rounded-full bg-amber-400 transition-all"
          :style="{ width: `${(score.value / 5) * 100}%` }"
        />
      </div>
      <span class="w-6 text-right text-xs font-medium tabular-nums text-gray-600">
        {{ score.value.toFixed(1) }}
      </span>
    </div>
  </div>
</template>
