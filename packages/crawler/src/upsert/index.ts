import type { SupabaseClient } from '@supabase/supabase-js'
import { Command } from 'commander'
import type { Database } from '../../../../src/types/database.js'
import type { CrawledProduct, SiteId } from '../schema/crawledProduct.js'
import { createLogger } from '../shared/logging/logger.js'
import { findProductImagePath } from '../shared/output/outputPaths.js'
import {
  applyImageOverride,
  applyOverrideDecisions,
  createNewProduct,
  insertProductSource,
  upsertPriceReport,
} from './applyImport.js'
import { loadCrawlerEnv } from './config/env.js'
import { diffProduct } from './diffProduct.js'
import { loadCrawledOutputs } from '../shared/output/loadCrawledOutputs.js'
import { loadExistingProductDetail } from './loadExistingProductDetail.js'
import { loadExistingProductMatches } from './loadExistingProductMatches.js'
import { resolveRequiredProductFields } from './resolveRequiredProductFields.js'
import {
  askCategoryForUnresolved,
  askCityName,
  askFieldGroupDecisions,
  askImageDecision,
  askWhichExistingProduct,
} from './promptDecisions.js'
import { createSupabaseAdminClient } from './supabaseAdminClient.js'
import { tryProbe } from './tryProbe.js'

const SITE_ORDER: readonly SiteId[] = ['rewe', 'knuspr', 'wolt']

const program = new Command()
program.option('--env <target>', 'local | production', 'local').parse(process.argv)
const { env: envTarget } = program.opts<{ env: 'local' | 'production' }>()

const logger = createLogger('upsert')
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

const resolveUnresolvedCategory = async (candidate: CrawledProduct): Promise<CrawledProduct> => {
  if (candidate.category) return candidate
  const category = await askCategoryForUnresolved(candidate.name)
  return { ...candidate, category }
}

const getExistingImageUrl = async (
  supabase: SupabaseClient<Database>,
  productId: string,
): Promise<string | null> => {
  const { data } = await supabase
    .from('product_image')
    .select('storage_path')
    .eq('product_id', productId)
    .order('sort_order')
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return supabase.storage.from('product-images').getPublicUrl(`${data.storage_path}/preview.webp`)
    .data.publicUrl
}

const crawledProducts = await loadCrawledOutputs(SITE_ORDER)
logger.info(`Loaded ${crawledProducts.length} crawled product(s) across ${SITE_ORDER.join(', ')}.`)

const cityName = await askCityName()

for (const crawledProduct of crawledProducts) {
  const product = await resolveUnresolvedCategory(crawledProduct)
  if (!product.category) {
    logger.error(`Skipping "${product.name}" - no category was chosen.`)
    continue
  }

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
      logger.error(`Skipping "${product.name}" - brand or quantity is missing.`)
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
    const decisions = await askFieldGroupDecisions(diffEntries)
    await applyOverrideDecisions(supabase, existingMatch.id, product, diffEntries, decisions)

    const localImagePath = await findProductImagePath(product.site, product.slug)
    const existingImageUrl = await getExistingImageUrl(supabase, existingMatch.id)
    const imageDecision = await askImageDecision(existingImageUrl, localImagePath)
    if (imageDecision === 'override')
      await applyImageOverride(supabase, existingMatch.id, env.importUserId, product)
  }

  await insertProductSource(supabase, existingMatch.id, product.sourceUrl)
  await upsertPriceReport(supabase, existingMatch.id, env.importUserId, cityName, product)
}

logger.info('Done.')
