import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { MotionAnimation } from '@/components/primitives/MotionAnimation'
import { useCountChangeAnimation } from '../useCountChangeAnimation'

describe('useCountChangeAnimation', () => {
  describe('given the count has not changed', () => {
    it('has no animation', () => {
      const { animationClass } = useCountChangeAnimation(() => 1)

      expect(animationClass.value).toBeUndefined()
    })
  })

  describe('when the count increases', () => {
    it('pops', async () => {
      const count = ref(1)
      const { animationClass } = useCountChangeAnimation(() => count.value)

      count.value = 2
      await nextTick()

      expect(animationClass.value).toBe(MotionAnimation.Pop)
    })
  })

  describe('when the count decreases', () => {
    it('squishes', async () => {
      const count = ref(2)
      const { animationClass } = useCountChangeAnimation(() => count.value)

      count.value = 1
      await nextTick()

      expect(animationClass.value).toBe(MotionAnimation.Squish)
    })
  })

  describe('when the animation is cleared', () => {
    it('has no animation', async () => {
      const count = ref(1)
      const { animationClass, clearAnimation } = useCountChangeAnimation(() => count.value)
      count.value = 2
      await nextTick()

      clearAnimation()

      expect(animationClass.value).toBeUndefined()
    })
  })
})
