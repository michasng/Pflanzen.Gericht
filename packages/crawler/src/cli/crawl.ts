import { Command, Option } from 'commander'
import { launchBrowser } from '../shared/browser/launchBrowser.js'
import { gotoAndHandleChallenge } from '../shared/browser/gotoAndHandleChallenge.js'
import { waitForEnterKey } from '../shared/browser/waitForEnterKey.js'
import { createConfirmingNavigator } from '../shared/browser/createConfirmingNavigator.js'
import { crawlProductUrls } from '../shared/crawling/crawlProductUrls.js'
import { crawlSite } from '../shared/crawling/crawlSite.js'
import { createLogger } from '../shared/logging/logger.js'
import { writeProductJson } from '../shared/output/writeProductJson.js'
import { downloadProductImage } from '../shared/output/downloadProductImage.js'
import { loadCrawledOutputs } from '../shared/output/loadCrawledOutputs.js'
import { createIncompleteProductCollector } from '../shared/logging/createIncompleteProductCollector.js'
import { logIncompleteProductSummary } from '../shared/logging/logIncompleteProductSummary.js'
import { createUnmappedCategoryCollector } from '../shared/logging/createUnmappedCategoryCollector.js'
import { logUnmappedCategorySummary } from '../shared/logging/logUnmappedCategorySummary.js'
import { findSiteCrawlerByProductUrl, findSiteCrawlerById, SITE_CRAWLERS } from '../sites/index.js'
import type { CrawlContext } from '../sites/types.js'
import type { CrawledProduct } from '../schema/crawledProduct.js'

const SESSION_SETUP_PROMPT = 'Accept/Deny cookies, then press Enter to start crawling...'

interface CrawlCliOptions {
  site?: string
  url?: string
  limit?: string
  skip?: string
  continue?: boolean
}

const program = new Command()
program
  .addOption(
    new Option(
      '--site <site>',
      `which site to crawl (${SITE_CRAWLERS.map((c) => c.id).join('|')})`,
    ).conflicts('url'),
  )
  .addOption(
    new Option('--url <url>', 'crawl only this product page instead of a listing').conflicts([
      'site',
      'limit',
      'skip',
      'continue',
    ]),
  )
  .option('--limit <count>', 'stop after this many products')
  .option('--skip <count>', 'ignore this many of the first products')
  .option('--continue', 'skip products already in the output')
  .parse(process.argv)

const options = program.opts<CrawlCliOptions>()
if (!options.site && !options.url) {
  console.error('Either --site or --url is required.')
  process.exit(1)
}

const siteCrawler = options.url
  ? findSiteCrawlerByProductUrl(options.url)
  : findSiteCrawlerById(options.site ?? '')
if (!siteCrawler) {
  console.error(
    options.url
      ? `No site supports the URL "${options.url}".`
      : `Unknown site "${options.site}". Available: ${SITE_CRAWLERS.map((c) => c.id).join(', ')}`,
  )
  process.exit(1)
}

const limit = options.limit ? Number.parseInt(options.limit, 10) : null
const skip = options.skip ? Number.parseInt(options.skip, 10) : 0
const excludedProductUrls = new Set(
  options.continue
    ? (await loadCrawledOutputs([siteCrawler.id])).map((product) => product.sourceUrl)
    : [],
)
const logger = createLogger(siteCrawler.id)
const session = await launchBrowser()
const page = await session.context.newPage()
const incompleteProducts = createIncompleteProductCollector()
const unmappedCategories = createUnmappedCategoryCollector()
const context: CrawlContext = {
  page,
  navigateTo: createConfirmingNavigator(
    (url) => gotoAndHandleChallenge(page, url, logger),
    () => waitForEnterKey(SESSION_SETUP_PROMPT),
  ),
  logger,
  incompleteProducts,
  unmappedCategories,
}

const products = options.url
  ? crawlProductUrls(siteCrawler, context, [options.url])
  : crawlSite(siteCrawler, context, { limit, skip, excludedProductUrls })

let count = 0
let imageFailureCount = 0

const saveProductImage = async (product: CrawledProduct): Promise<void> => {
  if (!product.imageSourceUrl) return
  try {
    await downloadProductImage(
      siteCrawler.id,
      product.name,
      product.sourceUrl,
      product.imageSourceUrl,
    )
  } catch (error) {
    imageFailureCount += 1
    logger.error(`Image download failed for "${product.name}": ${(error as Error).message}`)
  }
}

const saveProduct = async (product: CrawledProduct): Promise<void> => {
  const jsonPath = await writeProductJson(siteCrawler.id, product)
  logger.info(`Saved ${product.name} -> ${jsonPath}`)
  await saveProductImage(product)
  count += 1
}

try {
  for await (const product of products) await saveProduct(product)
} finally {
  await session.close()
}

logger.info(`Done. Wrote ${count} product(s), ${imageFailureCount} image failure(s).`)
logIncompleteProductSummary(logger, incompleteProducts.list())
logUnmappedCategorySummary(logger, unmappedCategories.list())
