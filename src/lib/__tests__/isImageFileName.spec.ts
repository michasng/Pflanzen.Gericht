import { describe, it, expect } from 'vitest'
import { isImageFileName } from '../isImageFileName'

describe('isImageFileName', () => {
  it('given a common image extension, returns true', () => {
    expect(isImageFileName('photo.jpg')).toBe(true)
    expect(isImageFileName('photo.PNG')).toBe(true)
  })

  it('given a non-image file name, returns false', () => {
    expect(isImageFileName('document.pdf')).toBe(false)
    expect(isImageFileName('photo')).toBe(false)
  })
})
