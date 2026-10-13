import { describe, expect, it, vi } from 'vitest'
import type { Logger } from '../logger.js'
import { createUnmappedCategoryCollector } from '../createUnmappedCategoryCollector.js'
import { recordUnmappedCategory } from '../recordUnmappedCategory.js'
import { logUnmappedCategorySummary } from '../logUnmappedCategorySummary.js'

const buildLogger = (): Logger => ({
  info: vi.fn<(message: string) => void>(),
  warn: vi.fn<(message: string) => void>(),
  error: vi.fn<(message: string) => void>(),
})
const unmappedCategory = { sourceUrl: 'https://example.test/a', name: 'Tofu', hint: 'tofu-slug' }

describe('recordUnmappedCategory', () => {
  it('logs the error and records the product for the summary', () => {
    const logger = buildLogger()
    const collector = createUnmappedCategoryCollector()

    recordUnmappedCategory(logger, collector, unmappedCategory)

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('tofu-slug'))
    expect(collector.list()).toEqual([unmappedCategory])
  })
})

describe('logUnmappedCategorySummary', () => {
  describe('given products with and without hints', () => {
    it('lists each unique hint or else the name sorted', () => {
      const logger = buildLogger()

      logUnmappedCategorySummary(logger, [
        unmappedCategory,
        { ...unmappedCategory, sourceUrl: 'https://example.test/b' },
        { sourceUrl: 'https://example.test/c', name: 'Seitan', hint: null },
      ])

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringMatching(/3 product\(s\)[^\n]*\n {2}- Seitan\n {2}- tofu-slug$/),
      )
    })
  })

  describe('given no unmapped categories', () => {
    it('logs nothing', () => {
      const logger = buildLogger()

      logUnmappedCategorySummary(logger, [])

      expect(logger.warn).not.toHaveBeenCalled()
    })
  })
})
