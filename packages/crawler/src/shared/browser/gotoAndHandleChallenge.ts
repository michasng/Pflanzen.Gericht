import type { Page } from 'playwright'
import type { Logger } from '../logging/logger.js'
import { waitForEnterKey } from './waitForEnterKey.js'

const CHALLENGE_TITLE_PATTERNS = [/just a moment/i, /einen moment/i, /attention required/i]
const CHALLENGE_SELECTORS = [
  '#challenge-form',
  'iframe[src*="challenges.cloudflare.com"]',
  'iframe[title*="challenge" i]',
]

const looksLikeChallenge = async (page: Page): Promise<boolean> => {
  const title = await page.title().catch(() => '')
  if (CHALLENGE_TITLE_PATTERNS.some((pattern) => pattern.test(title))) return true
  for (const selector of CHALLENGE_SELECTORS) {
    if (
      await page
        .locator(selector)
        .count()
        .then((count) => count > 0)
    )
      return true
  }
  return false
}

const waitForChallengeResolution = async (page: Page, logger: Logger): Promise<void> => {
  if (!(await looksLikeChallenge(page))) return
  logger.warn(
    `Challenge detected on ${page.url()} - solve it in the browser window, then press Enter here.`,
  )
  await waitForEnterKey('Press Enter once the page has loaded normally... ')
  while (await looksLikeChallenge(page)) {
    logger.warn('Challenge still present - press Enter again once resolved.')
    await waitForEnterKey('Press Enter to re-check... ')
  }
}

/**
 * Navigates to a URL and pauses for manual intervention whenever an
 * unexpected challenge (Cloudflare or similar) is detected, either right
 * after navigation or later triggered by an in-page action.
 */
export const gotoAndHandleChallenge = async (
  page: Page,
  url: string,
  logger: Logger,
): Promise<void> => {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await waitForChallengeResolution(page, logger)
}
