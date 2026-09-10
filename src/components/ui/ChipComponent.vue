<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    selected?: boolean
    interactive?: boolean
    removable?: boolean
    removeLabel?: string
  }>(),
  {
    selected: false,
    interactive: false,
    removable: false,
    removeLabel: 'Entfernen',
  },
)

defineEmits<{ remove: [] }>()

const toneClass = computed(() =>
  props.selected
    ? 'bg-primary-600 text-white border-primary-600'
    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300',
)
</script>

<template>
  <button
    v-if="interactive"
    type="button"
    class="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
    :class="toneClass"
  >
    <slot />
  </button>
  <span
    v-else
    class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
    :class="selected ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-600'"
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
