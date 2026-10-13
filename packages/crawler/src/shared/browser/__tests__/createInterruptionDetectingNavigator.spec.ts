import { describe, expect, it } from 'vitest'
import { CrawlAbortedError } from '../../crawling/CrawlAbortedError.js'
import { createInterruptionDetectingNavigator } from '../createInterruptionDetectingNavigator.js'

const URL = 'https://example.test/a'
const EXPECTED_SELECTOR = '#product'

describe('createInterruptionDetectingNavigator', () => {
  const setup = (isExpectedContentShown: boolean, shouldContinue = true) => {
    const events: string[] = []
    const navigateTo = createInterruptionDetectingNavigator({
      goto: async (url) => {
        events.push(`goto ${url}`)
      },
      waitForExpectedContent: async (expectedSelector) => {
        events.push(`wait for ${expectedSelector}`)
        return isExpectedContentShown
      },
      askWhetherToContinue: async (url) => {
        events.push(`ask whether to continue on ${url}`)
        return shouldContinue
      },
    })
    return { events, navigateTo }
  }

  describe('when the expected content appears', () => {
    it('continues without asking', async () => {
      const { events, navigateTo } = setup(true)

      await navigateTo(URL, EXPECTED_SELECTOR)

      expect(events).toEqual([`goto ${URL}`, `wait for ${EXPECTED_SELECTOR}`])
    })
  })

  describe('when the expected content does not appear', () => {
    it('asks whether to continue', async () => {
      const { events, navigateTo } = setup(false)

      await navigateTo(URL, EXPECTED_SELECTOR)

      expect(events).toEqual([
        `goto ${URL}`,
        `wait for ${EXPECTED_SELECTOR}`,
        `ask whether to continue on ${URL}`,
      ])
    })

    describe('when the user chooses to stop', () => {
      it('aborts the crawl', async () => {
        const { navigateTo } = setup(false, false)

        await expect(navigateTo(URL, EXPECTED_SELECTOR)).rejects.toBeInstanceOf(CrawlAbortedError)
      })
    })
  })
})
