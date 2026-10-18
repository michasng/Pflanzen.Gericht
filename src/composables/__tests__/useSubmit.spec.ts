import { describe, expect, it } from 'vitest'
import { createDeferred } from '@/__tests__/createDeferred'
import { useSubmit } from '../useSubmit'

describe('useSubmit', () => {
  describe('when the action is running', () => {
    it('is submitting and ignores further submits', async () => {
      const request = createDeferred<void>()
      let callCount = 0
      const { submitting, submit } = useSubmit(() => {
        callCount += 1
        return request.promise
      })

      const first = submit()
      await submit()

      expect(submitting.value).toBe(true)
      expect(callCount).toBe(1)
      request.resolve()
      await first
    })
  })

  describe('when the action succeeds', () => {
    it('has no error', async () => {
      const { errorMessage, submit } = useSubmit(() => Promise.resolve())

      await submit()

      expect(errorMessage.value).toBeNull()
    })
  })

  describe('when the action fails', () => {
    it('stores the error and allows a retry', async () => {
      let shouldFail = true
      const { submitting, errorMessage, submit } = useSubmit(() =>
        shouldFail ? Promise.reject(new Error('offline')) : Promise.resolve(),
      )

      await submit()

      expect(errorMessage.value).toBe('offline')
      expect(submitting.value).toBe(false)

      shouldFail = false
      await submit()

      expect(errorMessage.value).toBeNull()
    })
  })

  describe('when submitting with values', () => {
    it('passes them to the action', async () => {
      const received: string[] = []
      const { submit } = useSubmit((value: string) => {
        received.push(value)
        return Promise.resolve()
      })

      await submit('apple')

      expect(received).toEqual(['apple'])
    })
  })
})
