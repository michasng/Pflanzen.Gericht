<script setup lang="ts">
import { computed } from 'vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'
import { getButtonClasses } from '@/components/primitives/getButtonClasses'

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

const classes = computed(() => getButtonClasses(props))
</script>

<template>
  <button :type="type" :disabled="disabled" :aria-label="ariaLabel" :class="classes">
    <slot />
  </button>
</template>
