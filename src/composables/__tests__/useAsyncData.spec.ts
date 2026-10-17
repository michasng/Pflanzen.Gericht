import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createDeferred } from '@/__tests__/createDeferred'
import { useAsyncData } from '../useAsyncData'

describe('useAsyncData', () => {
  describe('when the loader is pending', () => {
    it('is loading without data', () => {
      const request = createDeferred<string | null>()

      const { data, loading } = useAsyncData(() => request.promise)

      expect(loading.value).toBe(true)
      expect(data.value).toBeNull()
    })
  })

  describe('when the loader returns data', () => {
    it('provides the data', async () => {
      const request = createDeferred<string | null>()
      const { data, loading, notFound, errorMessage } = useAsyncData(() => request.promise)

      request.resolve('apple')
      await request.promise

      expect(data.value).toBe('apple')
      expect(loading.value).toBe(false)
      expect(notFound.value).toBe(false)
      expect(errorMessage.value).toBeNull()
    })
  })

  describe('when the loader returns nothing', () => {
    it('reports not found', async () => {
      const request = createDeferred<string | null>()
      const { data, loading, notFound } = useAsyncData(() => request.promise)

      request.resolve(null)
      await request.promise

      expect(notFound.value).toBe(true)
      expect(data.value).toBeNull()
      expect(loading.value).toBe(false)
    })
  })

  describe('when the loader fails', () => {
    it('provides the error message', async () => {
      const request = createDeferred<string | null>()
      const { data, loading, errorMessage } = useAsyncData(() => request.promise)

      request.reject(new Error('offline'))
      await request.promise.catch(() => undefined)

      expect(errorMessage.value).toBe('offline')
      expect(data.value).toBeNull()
      expect(loading.value).toBe(false)
    })
  })

  describe('given a key', () => {
    it('loads with the current key', () => {
      const requestedKeys: string[] = []
      const key = ref('a')

      useAsyncData(
        (requestedKey: string) => {
          requestedKeys.push(requestedKey)
          return Promise.resolve(requestedKey)
        },
        () => key.value,
      )

      expect(requestedKeys).toEqual(['a'])
    })

    it('when the key changes then loads again', async () => {
      const key = ref('a')
      const requests = new Map([
        ['a', createDeferred<string | null>()],
        ['b', createDeferred<string | null>()],
      ])
      const { data } = useAsyncData(
        (requestedKey: string) => requests.get(requestedKey)?.promise ?? Promise.resolve(null),
        () => key.value,
      )
      requests.get('a')?.resolve('first')
      await requests.get('a')?.promise

      key.value = 'b'
      requests.get('b')?.resolve('second')

      await vi.waitFor(() => expect(data.value).toBe('second'))
    })

    it('when an older request resolves after a newer one then ignores the older response', async () => {
      const key = ref('a')
      const requests = new Map([
        ['a', createDeferred<string | null>()],
        ['b', createDeferred<string | null>()],
      ])
      const { data, loading } = useAsyncData(
        (requestedKey: string) => requests.get(requestedKey)?.promise ?? Promise.resolve(null),
        () => key.value,
      )
      key.value = 'b'
      await Promise.resolve()
      requests.get('b')?.resolve('second')
      await requests.get('b')?.promise

      requests.get('a')?.resolve('first')
      await requests.get('a')?.promise

      expect(data.value).toBe('second')
      expect(loading.value).toBe(false)
    })

    it('when an older request fails after a newer one then ignores the older error', async () => {
      const key = ref('a')
      const requests = new Map([
        ['a', createDeferred<string | null>()],
        ['b', createDeferred<string | null>()],
      ])
      const { errorMessage } = useAsyncData(
        (requestedKey: string) => requests.get(requestedKey)?.promise ?? Promise.resolve(null),
        () => key.value,
      )
      key.value = 'b'
      await Promise.resolve()
      requests.get('b')?.resolve('second')
      await requests.get('b')?.promise

      requests.get('a')?.reject(new Error('stale'))
      await requests.get('a')?.promise.catch(() => undefined)

      expect(errorMessage.value).toBeNull()
    })
  })

  describe('when reloading', () => {
    it('loads again and provides the new data', async () => {
      let version = 0
      const { data, reload } = useAsyncData(() => Promise.resolve(`version ${(version += 1)}`))

      await reload()

      expect(data.value).toBe('version 2')
    })
  })
})
