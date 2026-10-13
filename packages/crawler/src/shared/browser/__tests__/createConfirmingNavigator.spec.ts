import { describe, expect, it, vi } from 'vitest'
import { createConfirmingNavigator } from '../createConfirmingNavigator.js'

const EXPECTED_SELECTOR = '#content'

describe('createConfirmingNavigator', () => {
  const setup = () => {
    const visitedUrls: string[] = []
    const navigate = vi.fn<(url: string, expectedSelector: string) => Promise<void>>(
      async (url) => {
        visitedUrls.push(url)
      },
    )
    const waitForConfirmation = vi.fn<() => Promise<void>>(async () => {
      visitedUrls.push('confirmed')
    })
    return {
      visitedUrls,
      waitForConfirmation,
      navigateTo: createConfirmingNavigator(navigate, waitForConfirmation),
    }
  }

  describe('when navigating the first time', () => {
    it('asks for confirmation after the page loaded', async () => {
      const { visitedUrls, navigateTo } = setup()

      await navigateTo('https://example.test/a', EXPECTED_SELECTOR)

      expect(visitedUrls).toEqual(['https://example.test/a', 'confirmed'])
    })
  })

  describe('when navigating again', () => {
    it('does not ask for confirmation again', async () => {
      const { waitForConfirmation, navigateTo } = setup()

      await navigateTo('https://example.test/a', EXPECTED_SELECTOR)
      await navigateTo('https://example.test/b', EXPECTED_SELECTOR)

      expect(waitForConfirmation).toHaveBeenCalledTimes(1)
    })
  })
})
