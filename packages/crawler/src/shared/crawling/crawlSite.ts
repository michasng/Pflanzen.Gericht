import type { CrawledProduct } from '../../schema/crawledProduct.js'
import type {
  CrawlOptions,
  NavigationContext,
  ProductScraper,
  ProductUrlCollector,
} from '../../sites/types.js'
import type { Logger } from '../logging/logger.js'
import { resolveCollectLimit } from '../scraping/resolveCollectLimit.js'
import { selectProductUrls } from '../scraping/selectProductUrls.js'
import { crawlProductUrls } from './crawlProductUrls.js'

export const crawlSite = async function* <Context extends NavigationContext & { logger: Logger }>(
  siteCrawler: ProductUrlCollector<Context> & ProductScraper<Context>,
  context: Context,
  options: CrawlOptions,
): AsyncGenerator<CrawledProduct> {
  const collectedProductUrls = await siteCrawler.collectProductUrls(
    context,
    resolveCollectLimit(options),
  )
  const productUrls = selectProductUrls(collectedProductUrls, options)
  context.logger.info(`Found ${productUrls.length} candidate product links.`)
  yield* crawlProductUrls(siteCrawler, context, productUrls)
}
