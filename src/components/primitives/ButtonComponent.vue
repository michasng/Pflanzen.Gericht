<script setup lang="ts">
import { computed } from 'vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    tone?: ButtonTone
    type?: 'button' | 'submit'
    disabled?: boolean
    fullWidth?: boolean
    ariaLabel: string
  }>(),
  {
    variant: ButtonVariant.Filled,
    size: ButtonSize.Default,
    tone: ButtonTone.Default,
    type: 'button',
    disabled: false,
    fullWidth: false,
  },
)

const SIZE_CLASSES: Record<ButtonVariant, Partial<Record<ButtonSize, string>>> = {
  [ButtonVariant.Filled]: {
    [ButtonSize.Default]: 'px-4 py-2 rounded-lg text-sm font-medium',
    [ButtonSize.Large]: 'px-4 py-3 rounded-xl text-sm font-semibold',
  },
  [ButtonVariant.Outlined]: {
    [ButtonSize.Default]: 'px-4 py-2 rounded-lg text-sm font-medium',
    [ButtonSize.Compact]: 'px-3 py-2 rounded-lg text-sm font-medium',
    [ButtonSize.Comfortable]: 'px-6 py-2 rounded-lg text-sm font-medium',
    [ButtonSize.Large]: 'px-8 py-2.5 rounded-xl text-sm font-medium',
  },
  [ButtonVariant.Text]: {
    [ButtonSize.Default]: 'px-2 py-1 text-sm font-medium',
    [ButtonSize.Compact]: 'px-0 py-0 text-sm font-medium',
    [ButtonSize.Small]: 'px-0 py-0 text-xs font-medium',
  },
  [ButtonVariant.Icon]: {
    [ButtonSize.Default]: 'p-2 rounded-full text-sm font-medium',
  },
}

const TONE_CLASSES: Record<ButtonVariant, Partial<Record<ButtonTone, string>>> = {
  [ButtonVariant.Filled]: {
    [ButtonTone.Default]: 'bg-primary-600 text-white hover:bg-primary-700',
  },
  [ButtonVariant.Outlined]: {
    [ButtonTone.Default]: 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300',
    [ButtonTone.Danger]:
      'bg-white border border-red-100 text-red-600 hover:border-red-100 hover:bg-red-50',
    [ButtonTone.Muted]: 'border-0 bg-gray-100 text-gray-600 hover:bg-gray-200',
  },
  [ButtonVariant.Text]: {
    [ButtonTone.Default]: 'text-primary-600 hover:text-primary-700',
    [ButtonTone.Danger]: 'text-red-500 hover:text-red-600',
  },
  [ButtonVariant.Icon]: {
    [ButtonTone.Default]: 'text-gray-500 hover:bg-gray-100',
  },
}

const sizeClass = computed(
  () =>
    SIZE_CLASSES[props.variant][props.size] ??
    SIZE_CLASSES[props.variant][ButtonSize.Default] ??
    '',
)
const toneClass = computed(
  () =>
    TONE_CLASSES[props.variant][props.tone] ??
    TONE_CLASSES[props.variant][ButtonTone.Default] ??
    '',
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :aria-label="ariaLabel"
    class="inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:pointer-events-none"
    :class="[sizeClass, toneClass, fullWidth ? 'w-full flex-1' : '']"
  >
    <slot />
  </button>
</template>
