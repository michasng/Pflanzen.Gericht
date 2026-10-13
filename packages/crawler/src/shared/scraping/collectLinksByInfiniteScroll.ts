import type { Page } from 'playwright'

export interface CollectLinksOptions {
  /** only hrefs matching this pattern are considered real product links (filters out ads/cross-sell) */
  hrefPattern: RegExp
  /** optional "load more" button to click between scrolls, if the site uses one instead of pure infinite scroll */
  loadMoreButtonSelector?: string
  /** stop once this many product links have been found */
  limit: number | null
  maxIdleScrolls?: number
  scrollDelayMs?: number
}

const collectMatchingHrefs = async (page: Page, hrefPattern: RegExp): Promise<Set<string>> => {
  const hrefs = await page.$$eval('a[href]', (anchors) =>
    anchors.map((anchor) => anchor.getAttribute('href') ?? ''),
  )
  const baseUrl = page.url()
  // resolve relative hrefs to absolute before matching, since hrefPatterns are written for absolute URLs
  const matches = hrefs
    .map((href) => new URL(href, baseUrl).toString())
    .filter((href) => hrefPattern.test(href))
  return new Set(matches)
}

/**
 * Scrolls (and optionally clicks a "load more" button) until no new
 * matching product links appear, to reach items hidden behind pagination.
 * Links are accumulated across scrolls rather than re-read from the current
 * DOM snapshot, since virtualized lists unmount cards once scrolled past.
 */
export const collectLinksByInfiniteScroll = async (
  page: Page,
  options: CollectLinksOptions,
): Promise<string[]> => {
  const maxIdleScrolls = options.maxIdleScrolls ?? 3
  const scrollDelayMs = options.scrollDelayMs ?? 800
  const collectedLinks = new Set<string>()
  let idleScrolls = 0

  while (idleScrolls < maxIdleScrolls) {
    if (options.loadMoreButtonSelector) {
      const loadMoreButton = page.locator(options.loadMoreButtonSelector)
      if (await loadMoreButton.count()) {
        await loadMoreButton
          .first()
          .click({ trial: false })
          .catch(() => undefined)
      }
    }
    await page.mouse.wheel(0, 4000)
    await page.waitForTimeout(scrollDelayMs)

    const previousCount = collectedLinks.size
    for (const link of await collectMatchingHrefs(page, options.hrefPattern))
      collectedLinks.add(link)
    if (options.limit !== null && collectedLinks.size >= options.limit)
      return [...collectedLinks].slice(0, options.limit)
    idleScrolls = collectedLinks.size === previousCount ? idleScrolls + 1 : 0
  }

  return [...collectedLinks]
}
