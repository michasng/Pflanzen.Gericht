import { computed, ref, watch } from 'vue'
import { MotionAnimation } from '@/components/primitives/MotionAnimation'

export const useCountChangeAnimation = (count: () => number) => {
  const animation = ref<MotionAnimation | null>(null)

  watch(count, (currentCount, previousCount) => {
    animation.value = currentCount > previousCount ? MotionAnimation.Pop : MotionAnimation.Squish
  })

  const animationClass = computed(() => animation.value ?? undefined)
  const clearAnimation = () => {
    animation.value = null
  }

  return { animationClass, clearAnimation }
}
