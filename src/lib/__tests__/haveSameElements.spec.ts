import { describe, expect, it } from 'vitest'
import { haveSameElements } from '../haveSameElements'

const toKey = (element: { id: string }): string => element.id

describe('haveSameElements', () => {
  describe('given the same elements in a different order', () => {
    it('is true', () => {
      expect(haveSameElements([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'a' }], toKey)).toBe(
        true,
      )
    })
  })

  describe('given a different element', () => {
    it('is false', () => {
      expect(haveSameElements([{ id: 'a' }], [{ id: 'b' }], toKey)).toBe(false)
    })
  })

  describe('given different lengths', () => {
    it('is false', () => {
      expect(haveSameElements([{ id: 'a' }], [{ id: 'a' }, { id: 'a' }], toKey)).toBe(false)
    })
  })

  describe('given no elements', () => {
    it('is true', () => {
      expect(haveSameElements([], [], toKey)).toBe(true)
    })
  })
})
