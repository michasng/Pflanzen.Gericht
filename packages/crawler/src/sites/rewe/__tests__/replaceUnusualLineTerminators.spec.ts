import { describe, expect, it } from 'vitest'
import { replaceUnusualLineTerminators } from '../replaceUnusualLineTerminators.js'

describe('replaceUnusualLineTerminators', () => {
  describe('given line and paragraph separators', () => {
    it('replaces each with a regular newline', () => {
      expect(replaceUnusualLineTerminators('a\u2028b\u2029c')).toBe('a\nb\nc')
    })
  })

  describe('given text without unusual line terminators', () => {
    it('returns it unchanged', () => {
      expect(replaceUnusualLineTerminators('a\nb')).toBe('a\nb')
    })
  })
})
