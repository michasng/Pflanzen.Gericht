import { createKnusprCrawler } from './knuspr/index.js'
import { createReweCrawler } from './rewe/index.js'
import type { SiteCrawler } from './types.js'
import { createWoltCrawler } from './wolt/index.js'

export const SITE_CRAWLERS: readonly SiteCrawler[] = [
  createReweCrawler(),
  createKnusprCrawler(),
  createWoltCrawler(),
]

export const findSiteCrawlerByProductUrl = (
  url: string,
  crawlers: readonly SiteCrawler[] = SITE_CRAWLERS,
): SiteCrawler | undefined => crawlers.find((crawler) => crawler.isProductUrl(url))

export const findSiteCrawlerById = (
  id: string,
  crawlers: readonly SiteCrawler[] = SITE_CRAWLERS,
): SiteCrawler | undefined => crawlers.find((crawler) => crawler.id === id)
