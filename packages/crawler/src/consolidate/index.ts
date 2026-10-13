import type { SupabaseClient } from '@supabase/supabase-js'
import { Command } from 'commander'
import type { Database } from '../../../../src/types/database.js'
import type { CrawledProduct, SiteId } from '../schema/crawledProduct.js'
import { createLogger } from '../shared/logging/logger.js'
import { findProductImagePath } from '../shared/output/outputPaths.js'
import { slugifyProductName } from '../shared/output/slugifyProductName.js'
import {
  applyImageOverride,
  applyOverrideDecisions,
  createNewProduct,
  insertPriceReportsForCandidate,
  insertProductSources,
} from './applyImport.js'
import { loadCrawlerEnv } from './config/env.js'
import { diffProduct } from './diffProduct.js'
import { findExistingProductMatches } from './findExistingProductMatches.js'
import { groupCrawledProductsBySameProduct } from './groupCrawledProducts.js'
import { loadCrawledOutputs } from '../shared/output/loadCrawledOutputs.js'
import { loadExistingProductDetail } from './loadExistingProductDetail.js'
import { loadExistingProducts } from './loadExistingProducts.js'
import { resolveRequiredProductFields } from './resolveRequiredProductFields.js'
import {
  askCategoryForUnresolved,
  askCityName,
  askFieldGroupDecisions,
  askImageDecision,
  askShouldImportNew,
  askWhichExistingProduct,
} from './promptDecisions.js'
import { createSupabaseAdminClient } from './supabaseAdminClient.js'
import { tryProbe } from './tryProbe.js'

const SITE_ORDER: readonly SiteId[] = ['rewe', 'knuspr', 'wolt']

const program = new Command()
program.option('--env <target>', 'local | production', 'local').parse(process.argv)
const { env: envTarget } = program.opts<{ env: 'local' | 'production' }>()

const logger = createLogger('consolidate')
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

const candidates = groupCrawledProductsBySameProduct(crawledProducts, logger)
logger.info(`Consolidated into ${candidates.length} candidate product(s).`)

const existingProducts = await loadExistingProducts(supabase)
const cityName = await askCityName()

for (const candidate of candidates) {
  const primary = await resolveUnresolvedCategory(candidate.primary)
  if (!primary.category) {
    logger.error(`Skipping "${primary.name}" - no category was chosen.`)
    continue
  }

  const matches = findExistingProductMatches({ ...candidate, primary }, existingProducts)
  if (matches.length > 1) {
    logger.warn(
      `"${primary.name}" shares source URLs with ${matches.length} existing products: ${matches.map((match) => match.id).join(', ')}.`,
    )
  }
  const existingMatch =
    matches.length > 1 ? await askWhichExistingProduct(primary.name, matches) : (matches[0] ?? null)

  if (matches.length > 1 && !existingMatch) {
    logger.info(`Skipped "${primary.name}".`)
    continue
  }

  if (!existingMatch) {
    const requiredFields = resolveRequiredProductFields(primary)
    if (!requiredFields) {
      logger.error(`Skipping "${primary.name}" - brand or quantity is missing.`)
      continue
    }
    const shouldImport = await askShouldImportNew(primary.name)
    if (!shouldImport) {
      logger.info(`Skipped "${primary.name}".`)
      continue
    }
    const productId = await createNewProduct(supabase, primary, requiredFields, env.importUserId)
    await insertProductSources(supabase, productId, candidate)
    await insertPriceReportsForCandidate(supabase, productId, env.importUserId, cityName, {
      ...candidate,
      primary,
    })
    logger.info(`Imported new product "${primary.name}".`)
    continue
  }

  const existingDetail = await loadExistingProductDetail(supabase, existingMatch.id)
  const diffEntries = diffProduct(primary, existingMatch, existingDetail)

  if (diffEntries.length === 0) {
    logger.info(
      `"${primary.name}" is identical to existing product ${existingMatch.id} - no changes.`,
    )
  } else {
    logger.info(`"${primary.name}" differs from existing product ${existingMatch.id}:`)
    const decisions = await askFieldGroupDecisions(diffEntries)
    await applyOverrideDecisions(supabase, existingMatch.id, primary, diffEntries, decisions)

    const localImagePath = await findProductImagePath(
      primary.site,
      slugifyProductName(primary.name),
    )
    const existingImageUrl = await getExistingImageUrl(supabase, existingMatch.id)
    const imageDecision = await askImageDecision(existingImageUrl, localImagePath)
    if (imageDecision === 'override')
      await applyImageOverride(supabase, existingMatch.id, env.importUserId, primary)
  }

  await insertProductSources(supabase, existingMatch.id, candidate)
  await insertPriceReportsForCandidate(supabase, existingMatch.id, env.importUserId, cityName, {
    ...candidate,
    primary,
  })
}

logger.info('Done.')
