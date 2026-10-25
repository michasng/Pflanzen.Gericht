<script setup lang="ts">
import { ListVisibility } from '@/config/ListVisibility'
import { LIST_VISIBILITY_LABELS } from '@/config/listVisibilityLabels'
import Chip from '@/components/primitives/ChipComponent.vue'
import { ChipSize } from '@/components/primitives/ChipSize'
import { ChipTone } from '@/components/primitives/ChipTone'

defineProps<{ visibility: ListVisibility }>()

const TONES: Record<ListVisibility, ChipTone> = {
  [ListVisibility.Public]: ChipTone.Success,
  [ListVisibility.Private]: ChipTone.Muted,
}
</script>

<template>
  <Chip :size="ChipSize.Compact" :tone="TONES[visibility]">
    {{ LIST_VISIBILITY_LABELS[visibility] }}
  </Chip>
</template>
