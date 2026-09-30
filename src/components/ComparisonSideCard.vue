<script setup lang="ts">
import { computed } from 'vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ComparisonSide } from '@/types/ComparisonSide'

const props = defineProps<{
  side: ComparisonSide
  fieldLabel: string
  value: string
}>()

defineEmits<{ accept: [] }>()

const SIDE_CLASSES: Record<ComparisonSide, string> = {
  [ComparisonSide.A]: 'bg-blue-50 border-blue-200 text-blue-900',
  [ComparisonSide.B]: 'bg-orange-50 border-orange-200 text-orange-900',
}
const SIDE_LABELS: Record<ComparisonSide, string> = {
  [ComparisonSide.A]: 'User A',
  [ComparisonSide.B]: 'User B',
}

const sideClass = computed(() => SIDE_CLASSES[props.side])
const sideLabel = computed(() => SIDE_LABELS[props.side])
</script>

<template>
  <div
    class="rounded-lg border p-3 text-sm flex items-start justify-between gap-2"
    :class="sideClass"
  >
    <div class="min-w-0">
      <p class="text-xs font-semibold mb-0.5">{{ sideLabel }}</p>
      <p class="break-words whitespace-pre-line">{{ value }}</p>
    </div>
    <Button
      :ariaLabel="`${fieldLabel}, ${sideLabel}: ${value} akzeptieren`"
      :variant="ButtonVariant.Text"
      :size="ButtonSize.Small"
      class="shrink-0"
      @click="$emit('accept')"
    >
      Akzeptieren
    </Button>
  </div>
</template>
