<script setup lang="ts">
import { computed } from 'vue'
import { ChipSize } from '@/components/ui/ChipSize'
import { ChipTone } from '@/components/ui/ChipTone'

const props = withDefaults(
  defineProps<{
    selected?: boolean
    interactive?: boolean
    removable?: boolean
    removeLabel?: string
    tone?: ChipTone
    size?: ChipSize
  }>(),
  {
    selected: false,
    interactive: false,
    removable: false,
    removeLabel: 'Entfernen',
    tone: undefined,
    size: ChipSize.Default,
  },
)

defineEmits<{ remove: [] }>()

const interactiveToneClass = computed(() => {
  if (props.selected) return 'bg-primary-600 text-white border-primary-600'
  return 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
})

const staticToneClass = computed(() => {
  if (props.tone === ChipTone.Danger) return 'bg-red-50 text-red-700'
  if (props.tone === ChipTone.Success) return 'bg-green-50 text-green-700'
  if (props.tone === ChipTone.Muted) return 'bg-gray-100 text-gray-400'
  if (props.tone === ChipTone.Primary || props.selected) return 'bg-primary-50 text-primary-700'
  return 'bg-gray-100 text-gray-600'
})

const staticSizeClass = computed(() => {
  if (props.size === ChipSize.Compact) return 'px-2 py-0.5'
  return 'px-2.5 py-1'
})
</script>

<template>
  <button
    v-if="interactive"
    type="button"
    :aria-pressed="selected"
    class="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
    :class="interactiveToneClass"
  >
    <slot />
  </button>
  <span
    v-else
    class="inline-flex items-center gap-1 rounded-full text-xs font-medium"
    :class="[staticToneClass, staticSizeClass]"
  >
    <slot />
    <button
      v-if="removable"
      type="button"
      class="text-current opacity-70 hover:opacity-100"
      :aria-label="removeLabel"
      @click="$emit('remove')"
    >
      ✕
    </button>
  </span>
</template>
