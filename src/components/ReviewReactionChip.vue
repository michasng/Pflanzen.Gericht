<script setup lang="ts">
import { computed } from 'vue'
import Chip from '@/components/primitives/ChipComponent.vue'
import { ChipSize } from '@/components/primitives/ChipSize'
import Tooltip from '@/components/primitives/TooltipComponent.vue'
import { formatReactionCount } from '@/lib/formatReactionCount'
import { formatReactorsTooltip } from '@/lib/formatReactorsTooltip'
import type { ReactionChip } from '@/types/ReactionChip'

const props = defineProps<{
  chip: ReactionChip
  interactive: boolean
  disabled?: boolean
}>()

defineEmits<{ toggle: [] }>()

const countLabel = computed(() => formatReactionCount(props.chip.count))
const tooltipText = computed(() => formatReactorsTooltip(props.chip.reactors))

const accessibleName = computed(() => {
  const count = props.chip.count === 0 ? 'keine Reaktionen' : `${props.chip.count} Reaktionen`
  return props.chip.isMine
    ? `${props.chip.emoji}, ${count}, von dir ausgewählt`
    : `${props.chip.emoji}, ${count}`
})
</script>

<template>
  <Tooltip :text="tooltipText">
    <Chip
      :interactive="interactive"
      :selected="chip.isMine"
      :size="ChipSize.Compact"
      :disabled="interactive ? disabled : undefined"
      :aria-label="accessibleName"
      :role="interactive ? undefined : 'group'"
      :tabindex="interactive ? undefined : 0"
      @click="interactive && $emit('toggle')"
    >
      <span aria-hidden="true">{{ chip.emoji }}</span>
      <span v-if="countLabel" aria-hidden="true" class="text-xs">{{ countLabel }}</span>
    </Chip>
  </Tooltip>
</template>
