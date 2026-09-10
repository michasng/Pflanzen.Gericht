<script setup lang="ts">
import { computed } from 'vue'
import { ProgressBarColor } from '@/components/primitives/ProgressBarColor'

const MIN_PERCENT = 0
const MAX_PERCENT = 100

const props = withDefaults(defineProps<{ percent: number; color?: ProgressBarColor }>(), {
  color: ProgressBarColor.Primary,
})

const COLOR_CLASSES: Record<ProgressBarColor, string> = {
  [ProgressBarColor.Primary]: 'bg-primary-500',
  [ProgressBarColor.Amber]: 'bg-amber-400',
}

const clampedPercent = computed(() => Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, props.percent)))
const colorClass = computed(() => COLOR_CLASSES[props.color])
</script>

<template>
  <div
    class="h-1.5 overflow-hidden rounded-full bg-gray-100"
    role="progressbar"
    :aria-valuenow="clampedPercent"
    :aria-valuemin="MIN_PERCENT"
    :aria-valuemax="MAX_PERCENT"
  >
    <div
      class="h-full rounded-full transition-all"
      :class="colorClass"
      :style="{ width: `${clampedPercent}%` }"
    />
  </div>
</template>
