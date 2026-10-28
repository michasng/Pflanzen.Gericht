<script setup lang="ts">
import { MotionAnimation } from '@/components/primitives/MotionAnimation'

withDefaults(
  defineProps<{
    tag?: string
    enterAnimation?: MotionAnimation
    leaveAnimation?: MotionAnimation
  }>(),
  {
    tag: 'div',
    enterAnimation: MotionAnimation.Pop,
    leaveAnimation: MotionAnimation.Shrink,
  },
)
</script>

<template>
  <TransitionGroup
    :tag="tag"
    :enter-active-class="enterAnimation"
    :leave-active-class="leaveAnimation"
  >
    <slot />
  </TransitionGroup>
</template>
