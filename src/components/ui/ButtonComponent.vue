<script setup lang="ts">
import { computed } from 'vue'
import { ButtonVariant } from '@/components/ui/ButtonVariant'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    type?: 'button' | 'submit'
    disabled?: boolean
    ariaLabel?: string
  }>(),
  {
    variant: ButtonVariant.Filled,
    type: 'button',
    disabled: false,
    ariaLabel: undefined,
  },
)

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  [ButtonVariant.Filled]: 'px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700',
  [ButtonVariant.Outlined]:
    'px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-primary-300',
  [ButtonVariant.Text]: 'px-2 py-1 text-primary-600 hover:text-primary-700',
  [ButtonVariant.Icon]: 'p-2 rounded-full text-gray-500 hover:bg-gray-100',
}

const variantClass = computed(() => VARIANT_CLASSES[props.variant])
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :aria-label="ariaLabel"
    class="inline-flex items-center justify-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
    :class="variantClass"
  >
    <slot />
  </button>
</template>
