import type { Page } from 'playwright'
import type { Logger } from '../shared/logging/logger.js'
import type { CrawledProduct, SiteId } from '../schema/crawledProduct.js'
import type { IncompleteProductRecorder } from '../shared/logging/createIncompleteProductCollector.js'
import type { UnmappedCategoryRecorder } from '../shared/logging/createUnmappedCategoryCollector.js'

export interface CrawlOptions {
  limit: number | null
  skip: number
  excludedProductUrls: ReadonlySet<string>
}

export interface NavigationContext {
  navigateTo(url: string): Promise<void>
}

export interface CrawlContext extends NavigationContext {
  page: Page
  logger: Logger
  incompleteProducts: IncompleteProductRecorder
  unmappedCategories: UnmappedCategoryRecorder
}

export interface ProductUrlCollector<Context> {
  collectProductUrls(context: Context, collectLimit: number | null): Promise<string[]>
}

export interface ProductScraper<Context> {
  /** reads the product from the page, which is already navigated to `productUrl` */
  scrapeProduct(context: Context, productUrl: string): Promise<CrawledProduct | null>
}

export interface SiteCrawler
  extends ProductUrlCollector<CrawlContext>, ProductScraper<CrawlContext> {
  id: SiteId
  isProductUrl(url: string): boolean
}
