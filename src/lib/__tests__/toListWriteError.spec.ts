import { describe, expect, it } from 'vitest'
import { ListNameClashError } from '@/lib/ListNameClashError'
import { toListWriteError } from '@/lib/toListWriteError'

describe('toListWriteError', () => {
  describe('given a unique violation', () => {
    it('reports a name clash', () => {
      expect(toListWriteError({ code: '23505', message: 'duplicate key' })).toBeInstanceOf(
        ListNameClashError,
      )
    })
  })

  describe('given any other error', () => {
    it('keeps the error', () => {
      const error = new Error('offline')

      expect(toListWriteError(error)).toBe(error)
    })
  })
})
