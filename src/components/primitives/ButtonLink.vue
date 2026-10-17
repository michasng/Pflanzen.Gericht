<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'
import { getButtonClasses } from '@/components/primitives/getButtonClasses'

const props = withDefaults(
  defineProps<{
    to: RouteLocationRaw
    variant?: ButtonVariant
    size?: ButtonSize
    tone?: ButtonTone
    fullWidth?: boolean
  }>(),
  {
    variant: ButtonVariant.Filled,
    size: ButtonSize.Default,
    tone: ButtonTone.Default,
    fullWidth: false,
  },
)

const classes = computed(() => getButtonClasses(props))
</script>

<template>
  <RouterLink :to="to" :class="classes">
    <slot />
  </RouterLink>
</template>
