import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { createDeferred } from '@/__tests__/createDeferred'
import {
  USERNAME_CHECK_DEBOUNCE_MILLISECONDS,
  useUsernameAvailability,
} from '../useUsernameAvailability'

const VALID_USERNAME = 'valid_name'

const setUp = (checkAvailability: (username: string) => Promise<boolean>) => {
  const username = ref('')
  const scope = effectScope()
  const availability = scope.run(() => useUsernameAvailability(username, checkAvailability))
  if (!availability) throw new Error('Scope is inactive.')
  return { username, scope, ...availability }
}

describe('useUsernameAvailability', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('given an invalid username', () => {
    it('does not check and is not checking', () => {
      const check = vi.fn<(username: string) => Promise<boolean>>(() => Promise.resolve(true))
      const { username, isChecking } = setUp(check)

      username.value = 'A!'
      vi.advanceTimersByTime(USERNAME_CHECK_DEBOUNCE_MILLISECONDS)

      expect(check).not.toHaveBeenCalled()
      expect(isChecking.value).toBe(false)
    })
  })

  describe('when a valid username is typed', () => {
    it('waits for the debounce delay while checking', () => {
      const check = vi.fn<(username: string) => Promise<boolean>>(() => Promise.resolve(true))
      const { username, isChecking } = setUp(check)

      username.value = VALID_USERNAME
      vi.advanceTimersByTime(USERNAME_CHECK_DEBOUNCE_MILLISECONDS - 1)

      expect(check).not.toHaveBeenCalled()
      expect(isChecking.value).toBe(true)
    })

    it('reports the result once the check finishes', async () => {
      const { username, isAvailable, isChecking } = setUp(() => Promise.resolve(false))

      username.value = VALID_USERNAME
      await vi.advanceTimersByTimeAsync(USERNAME_CHECK_DEBOUNCE_MILLISECONDS)

      expect(isAvailable.value).toBe(false)
      expect(isChecking.value).toBe(false)
    })
  })

  describe('given the username changes again before the delay passed', () => {
    it('checks only the latest username', async () => {
      const check = vi.fn<(username: string) => Promise<boolean>>(() => Promise.resolve(true))
      const { username } = setUp(check)

      username.value = 'first_name'
      await vi.advanceTimersByTimeAsync(USERNAME_CHECK_DEBOUNCE_MILLISECONDS - 1)
      username.value = 'second_name'
      await vi.advanceTimersByTimeAsync(USERNAME_CHECK_DEBOUNCE_MILLISECONDS)

      expect(check).toHaveBeenCalledExactlyOnceWith('second_name')
    })
  })

  describe('given a slow earlier check resolves after a newer one', () => {
    it('ignores the outdated result', async () => {
      const slowFirst = createDeferred<boolean>()
      const fastSecond = createDeferred<boolean>()
      const results = new Map([
        ['first_name', slowFirst.promise],
        ['second_name', fastSecond.promise],
      ])
      const { username, isAvailable, isChecking } = setUp(
        (name) => results.get(name) ?? Promise.resolve(true),
      )

      username.value = 'first_name'
      await vi.advanceTimersByTimeAsync(USERNAME_CHECK_DEBOUNCE_MILLISECONDS)
      username.value = 'second_name'
      await vi.advanceTimersByTimeAsync(USERNAME_CHECK_DEBOUNCE_MILLISECONDS)
      fastSecond.resolve(false)
      await fastSecond.promise
      slowFirst.resolve(true)
      await slowFirst.promise

      expect(isAvailable.value).toBe(false)
      expect(isChecking.value).toBe(false)
    })
  })

  describe('given the username becomes invalid while a check is pending', () => {
    it('drops the result and stops checking', async () => {
      const pending = createDeferred<boolean>()
      const { username, isAvailable, isChecking } = setUp(() => pending.promise)

      username.value = VALID_USERNAME
      await vi.advanceTimersByTimeAsync(USERNAME_CHECK_DEBOUNCE_MILLISECONDS)
      username.value = 'A!'
      pending.resolve(true)
      await pending.promise

      expect(isAvailable.value).toBeNull()
      expect(isChecking.value).toBe(false)
    })
  })

  describe('given the check fails', () => {
    it('shows the error and stops checking', async () => {
      const { username, checkError, isAvailable, isChecking } = setUp(() =>
        Promise.reject(new Error('offline')),
      )

      username.value = VALID_USERNAME
      await vi.advanceTimersByTimeAsync(USERNAME_CHECK_DEBOUNCE_MILLISECONDS)

      expect(checkError.value).toBe('offline')
      expect(isAvailable.value).toBeNull()
      expect(isChecking.value).toBe(false)
    })

    it('clears the error when the username changes', async () => {
      const { username, checkError } = setUp(() => Promise.reject(new Error('offline')))
      username.value = VALID_USERNAME
      await vi.advanceTimersByTimeAsync(USERNAME_CHECK_DEBOUNCE_MILLISECONDS)

      username.value = 'other_name'

      expect(checkError.value).toBeNull()
    })
  })

  describe('when the scope is disposed during the delay', () => {
    it('never checks', () => {
      const check = vi.fn<(username: string) => Promise<boolean>>(() => Promise.resolve(true))
      const { username, scope } = setUp(check)
      username.value = VALID_USERNAME

      scope.stop()
      vi.advanceTimersByTime(USERNAME_CHECK_DEBOUNCE_MILLISECONDS)

      expect(check).not.toHaveBeenCalled()
    })
  })
})
