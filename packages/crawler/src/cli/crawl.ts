import { parseCrawlArguments } from './parseCrawlArguments.js'
import { launchBrowser } from '../shared/browser/launchBrowser.js'
import { createInterruptionDetectingNavigator } from '../shared/browser/createInterruptionDetectingNavigator.js'
import { waitForEnterKey } from '../shared/browser/waitForEnterKey.js'
import { promptForAnswer } from '../shared/browser/promptForAnswer.js'
import { CrawlAbortedError } from '../shared/crawling/CrawlAbortedError.js'
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
import type { CrawlContext } from '../sites/types.js'
import type { CrawledProduct } from '../schema/crawledProduct.js'

const SESSION_SETUP_PROMPT = 'Accept/Deny cookies, then press Enter to start crawling...'
const INTERRUPTION_PROMPT =
  'Resolve it in the browser window, then press Enter to continue crawling, or type q and Enter to stop... '
const CONTINUE_ANSWER = ''
const EXPECTED_CONTENT_TIMEOUT_MILLISECONDS = 5_000

const { options, siteCrawler } = parseCrawlArguments(process.argv.slice(2))

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
    createInterruptionDetectingNavigator({
      goto: async (url) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' })
      },
      waitForExpectedContent: (expectedSelector) =>
        page
          .waitForSelector(expectedSelector, {
            state: 'attached',
            timeout: EXPECTED_CONTENT_TIMEOUT_MILLISECONDS,
          })
          .then(
            () => true,
            () => false,
          ),
      askWhetherToContinue: async (url) => {
        logger.warn(`Interruption detected: the expected page did not appear for ${url}.`)
        return (await promptForAnswer(INTERRUPTION_PROMPT)).trim() === CONTINUE_ANSWER
      },
    }),
    () => waitForEnterKey(SESSION_SETUP_PROMPT),
  ),
  logger,
  incompleteProducts,
  unmappedCategories,
}

const products = options.urls
  ? crawlProductUrls(siteCrawler, context, options.urls)
  : crawlSite(siteCrawler, context, { limit, skip, excludedProductUrls })

let count = 0
let imageFailureCount = 0

const saveProductImage = async (product: CrawledProduct): Promise<void> => {
  if (!product.imageSourceUrl) return
  try {
    await downloadProductImage(siteCrawler.id, product.slug, product.imageSourceUrl)
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
} catch (error) {
  if (!(error instanceof CrawlAbortedError)) throw error
  logger.warn(error.message)
} finally {
  await session.close()
}

logger.info(`Done. Wrote ${count} product(s), ${imageFailureCount} image failure(s).`)
logIncompleteProductSummary(logger, incompleteProducts.list())
logUnmappedCategorySummary(logger, unmappedCategories.list())
