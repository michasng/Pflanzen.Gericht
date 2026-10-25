import { Command } from 'commander'
import type { SiteId } from '../schema/crawledProduct.js'
import { createLogger } from '../shared/logging/logger.js'
import {
  applyOverrideDecisions,
  createNewProduct,
  insertProductSource,
  upsertPriceReport,
} from './applyImport.js'
import { loadCrawlerEnv } from './config/env.js'
import { diffProduct, type DiffEntry } from './diffProduct.js'
import { loadCrawledOutputs } from '../shared/output/loadCrawledOutputs.js'
import { loadExistingProductDetail } from './loadExistingProductDetail.js'
import { loadExistingProductMatches } from './loadExistingProductMatches.js'
import { printDiffEntry } from './printDiffEntry.js'
import { resolveRequiredProductFields } from './resolveRequiredProductFields.js'
import {
  askCityName,
  askFieldGroupDecisions,
  askWhichExistingProduct,
  type FieldDecision,
} from './promptDecisions.js'
import { createSupabaseAdminClient } from './supabaseAdminClient.js'
import { tryProbe } from './tryProbe.js'
import { updateProductImages } from './updateProductImages.js'

const SITE_ORDER: readonly SiteId[] = ['rewe', 'knuspr', 'wolt']

const program = new Command()
program
  .option('--env <target>', 'local | production', 'local')
  .option('--update-prices', 'update price reports of existing products', false)
  .option('--update-images', 'offer to replace images of existing products', false)
  .option('--override-all', 'override every changed field and image without asking', false)
  .parse(process.argv)
const {
  env: envTarget,
  updatePrices: shouldUpdatePrices,
  updateImages: shouldUpdateImages,
  overrideAll: shouldOverrideAll,
} = program.opts<{
  env: 'local' | 'production'
  updatePrices: boolean
  updateImages: boolean
  overrideAll: boolean
}>()

const decideFields = async (diffEntries: DiffEntry[]): Promise<Map<string, FieldDecision>> => {
  if (shouldOverrideAll) {
    for (const diffEntry of diffEntries) printDiffEntry(diffEntry)
    return new Map(diffEntries.map((entry) => [entry.field, 'override']))
  }
  return askFieldGroupDecisions(diffEntries)
}

const logger = createLogger('import')
const env = loadCrawlerEnv(envTarget)
const supabase = createSupabaseAdminClient(env)

const connectionProblem = await tryProbe(() =>
  supabase.from('product').select('id', { head: true, count: 'exact' }),
)
if (connectionProblem) {
  logger.error(
    `Cannot reach the ${envTarget} database at ${env.supabaseUrl}. Is it running? ${connectionProblem}`,
  )
  process.exit(1)
}

const crawledProducts = await loadCrawledOutputs(SITE_ORDER)
logger.info(`Loaded ${crawledProducts.length} crawled product(s) across ${SITE_ORDER.join(', ')}.`)

const cityName = await askCityName()

for (const product of crawledProducts) {
  // Looked up per product, so stores sharing an existing product see each other's changes.
  const matches = await loadExistingProductMatches(supabase, product.sourceUrl)
  if (matches.length > 1) {
    logger.warn(
      `"${product.name}" shares its source URL with ${matches.length} existing products: ${matches.map((match) => match.id).join(', ')}.`,
    )
  }
  const existingMatch =
    matches.length > 1 ? await askWhichExistingProduct(product.name, matches) : (matches[0] ?? null)

  if (matches.length > 1 && !existingMatch) {
    logger.info(`Skipped "${product.name}".`)
    continue
  }

  if (!existingMatch) {
    const requiredFields = resolveRequiredProductFields(product)
    if (!requiredFields) {
      logger.error(`Skipping "${product.name}" - category, brand or quantity is missing.`)
      continue
    }
    const productId = await createNewProduct(supabase, product, requiredFields, env.importUserId)
    await insertProductSource(supabase, productId, product.sourceUrl)
    await upsertPriceReport(supabase, productId, env.importUserId, cityName, product)
    logger.info(`Imported new product "${product.name}".`)
    continue
  }

  const existingDetail = await loadExistingProductDetail(supabase, existingMatch.id)
  const diffEntries = diffProduct(product, existingMatch, existingDetail)

  if (diffEntries.length === 0) {
    logger.info(
      `"${product.name}" is identical to existing product ${existingMatch.id} - no changes.`,
    )
  } else {
    logger.info(
      `"${product.name}" (${product.site}) differs from existing product ${existingMatch.id}:`,
    )
    const decisions = await decideFields(diffEntries)
    await applyOverrideDecisions(supabase, existingMatch.id, product, diffEntries, decisions)
  }

  if (shouldUpdateImages)
    await updateProductImages(
      supabase,
      existingMatch.id,
      env.importUserId,
      product,
      shouldOverrideAll,
    )

  if (shouldUpdatePrices)
    await upsertPriceReport(supabase, existingMatch.id, env.importUserId, cityName, product)
}

logger.info('Done.')
