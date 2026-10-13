import { chromium, type Browser, type BrowserContext } from 'playwright'

export interface CrawlerBrowserSession {
  browser: Browser
  context: BrowserContext
  close(): Promise<void>
}

// Fresh, non-headless context every run - no persisted profile/cookies.
// Real Edge (not bundled Chromium) + hidden automation flag reduce Cloudflare bot detection.
export const launchBrowser = async (): Promise<CrawlerBrowserSession> => {
  const browser = await chromium.launch({
    headless: false,
    channel: 'msedge',
    args: ['--disable-blink-features=AutomationControlled'],
  })
  const context = await browser.newContext({ locale: 'de-DE' })
  return {
    browser,
    context,
    close: async () => {
      await context.close()
      await browser.close()
    },
  }
}
