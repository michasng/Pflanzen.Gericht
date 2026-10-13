import { describe, expect, it, vi } from 'vitest'
import type { Logger } from '../logger.js'
import { createIncompleteProductCollector } from '../createIncompleteProductCollector.js'
import { recordIncompleteProduct } from '../recordIncompleteProduct.js'
import { logIncompleteProductSummary } from '../logIncompleteProductSummary.js'

const buildLogger = (): Logger => ({
  info: vi.fn<(message: string) => void>(),
  warn: vi.fn<(message: string) => void>(),
  error: vi.fn<(message: string) => void>(),
})
const incompleteProduct = {
  sourceUrl: 'https://example.test/a',
  name: 'Tofu',
  missingFieldNames: ['brand', 'quantity'],
}

describe('recordIncompleteProduct', () => {
  describe('given missing fields', () => {
    it('logs the error and records the product for the summary', () => {
      const logger = buildLogger()
      const collector = createIncompleteProductCollector()

      recordIncompleteProduct(logger, collector, incompleteProduct)

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('https://example.test/a'))
      expect(collector.list()).toEqual([incompleteProduct])
    })
  })

  describe('given no missing fields', () => {
    it('neither logs nor records', () => {
      const logger = buildLogger()
      const collector = createIncompleteProductCollector()

      recordIncompleteProduct(logger, collector, { ...incompleteProduct, missingFieldNames: [] })

      expect(logger.error).not.toHaveBeenCalled()
      expect(collector.list()).toEqual([])
    })
  })
})

describe('logIncompleteProductSummary', () => {
  describe('given incomplete products', () => {
    it('lists each with its missing fields and link', () => {
      const logger = buildLogger()

      logIncompleteProductSummary(logger, [incompleteProduct])

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringMatching(
          /1 product\(s\)[\s\S]*Tofu: missing brand and quantity[\s\S]*example\.test\/a/,
        ),
      )
    })
  })

  describe('given no incomplete products', () => {
    it('logs nothing', () => {
      const logger = buildLogger()

      logIncompleteProductSummary(logger, [])

      expect(logger.warn).not.toHaveBeenCalled()
    })
  })
})
