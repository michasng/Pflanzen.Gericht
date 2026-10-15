import type { Page } from 'playwright'
import type { SiteCrawler, CrawlContext } from '../types.js'
import type { CrawledProduct } from '../../schema/crawledProduct.js'
import type { Allergen, KnownNutrientName } from '@pflanzen-gericht/contracts'
import { collectLinksByInfiniteScroll } from '../../shared/scraping/collectLinksByInfiniteScroll.js'
import { resolveCategoryFromKeywords } from '../../shared/categoryKeywordMapping.js'
import { resolveBaseFromIngredients } from '../../shared/resolveBaseFromIngredients.js'
import { listMissingRequiredFieldNames } from '../../shared/parsing/listMissingRequiredFieldNames.js'
import { parseEuroCents } from '../../shared/parsing/parseEuroCents.js'
import type { ParsedNutrition } from '../../shared/parsing/parsedNutrition.js'
import { recordIncompleteProduct } from '../../shared/logging/recordIncompleteProduct.js'
import { recordUnmappedCategory } from '../../shared/logging/recordUnmappedCategory.js'
import { extractBrandFromName } from './extractBrandFromName.js'
import { parseQuantityFromName } from './parseQuantityFromName.js'
import { removeTrailingQuantity } from '../../shared/parsing/removeTrailingQuantity.js'
import { extractSlugFromUrlPath } from '../../shared/output/extractSlugFromUrlPath.js'

const LISTING_URL = 'https://wolt.com/en/deu/munich/venue/wolt-market-schwabing/items/vegan-280'
// Product dialogs live at their own URL: .../venue/{venue}/{slug}-itemid-{itemId}.
const PRODUCT_HREF_PATTERN =
  /^https:\/\/wolt\.com\/en\/deu\/munich\/venue\/wolt-market-schwabing\/[^/]+-itemid-([a-z0-9]+)$/i
const PRODUCT_JSON_LD_SELECTOR = 'script[type="application/ld+json"]'
const PRODUCT_SLUG_PATH_SEGMENT_COUNT = 1
const PRODUCT_LINK_SELECTOR = 'a[href*="-itemid-"]'
const PRODUCT_INFO_HEADING_SELECTOR = 'h3'
// The "Product info" modal embeds this same standalone page in an iframe, whose hydration state
// is unreliable to scrape live; navigating to it directly gets the server-rendered content instead.
const PRODUCT_INFO_VENUE_ID = '68a2f43a01d603e6a14a341f'
const buildProductInfoUrl = (productUrl: string): string | null => {
  const itemId = PRODUCT_HREF_PATTERN.exec(productUrl)?.[1]
  return itemId ? `https://prodinfo.wolt.com/de/${PRODUCT_INFO_VENUE_ID}/${itemId}?lang=de` : null
}

const ALLERGEN_TEXT_PATTERNS: readonly (readonly [Allergen, RegExp])[] = [
  ['gluten', /gluten/i],
  ['soy', /soja/i],
  ['nuts', /(schalenfr[üu]chte|n[üu]sse)/i],
]

// The prodinfo.wolt.com page uses the exact same German nutrient labels as
// the app's own taxonomy, one nutrition row per table <li>.
const NUTRIENT_ROW_LABEL_MAP: Readonly<Record<string, KnownNutrientName>> = {
  Fett: 'Fett',
  'davon gesättigte Fettsäuren': 'Gesättigte Fettsäuren',
  Kohlenhydrate: 'Kohlenhydrate',
  'davon Zucker': 'Zucker',
  Ballaststoffe: 'Ballaststoffe',
  Eiweiß: 'Eiweiß',
  Salz: 'Salz',
}
const ENERGY_ROW_LABEL = 'Energie'

const parseAllergens = (allergenText: string): Allergen[] =>
  ALLERGEN_TEXT_PATTERNS.filter(([, pattern]) => pattern.test(allergenText)).map(
    ([allergen]) => allergen,
  )

interface ProductJsonLd {
  name: string
  description: string | null
  imageSourceUrl: string | null
  priceEuroCents: number
}

interface ParsedJsonLdProduct {
  '@type'?: string
  name?: string
  description?: string
  image?: string[]
  offers?: { price?: string }
}

// The visible name/description/price/image are populated client-side and race with the page's
// hydration, but Wolt also server-renders a schema.org Product block synchronously - read that instead.
const readProductJsonLd = async (page: Page): Promise<ProductJsonLd | null> => {
  const scriptContents = await page.locator(PRODUCT_JSON_LD_SELECTOR).allTextContents()
  for (const scriptContent of scriptContents) {
    const parsed: ParsedJsonLdProduct = JSON.parse(scriptContent)
    if (parsed['@type'] !== 'Product') continue
    return {
      name: parsed.name ?? '',
      description: parsed.description ?? null,
      imageSourceUrl: parsed.image?.[0] ?? null,
      priceEuroCents: parseEuroCents(parsed.offers?.price),
    }
  }
  return null
}

interface NutritionRow {
  label: string
  amountText: string
}

const readNutritionRows = (page: Page): Promise<NutritionRow[]> =>
  page.locator('ul[class*="nutritionTable"] li[class*="nutritionRow"]').evaluateAll((rows) =>
    rows.map((row) => {
      const label = row.querySelector('span')?.textContent?.trim() ?? ''
      const firstValueGroup = row.querySelector(
        'div[class*="nutritionValueGroup"] > div[class*="nutritionValue"]',
      )
      const amountText = firstValueGroup?.querySelector('span')?.textContent?.trim() ?? ''
      return { label, amountText }
    }),
  )

const parseNutritionRows = (rows: NutritionRow[]): ParsedNutrition => {
  const nutrientsPer100g: Partial<Record<KnownNutrientName, number>> = {}
  let energyKilojoules: number | null = null
  for (const row of rows) {
    const amount = Number.parseFloat(row.amountText.replace(',', '.'))
    if (!Number.isFinite(amount)) continue
    if (row.label === ENERGY_ROW_LABEL) {
      energyKilojoules = amount
      continue
    }
    const nutrientName = NUTRIENT_ROW_LABEL_MAP[row.label]
    if (nutrientName) nutrientsPer100g[nutrientName] = amount
  }
  return { energyKilojoules, nutrientsPer100g }
}

// Each info item on the prodinfo page is an <h3> heading followed by its
// value paragraph as the next sibling - a stable structural pattern even
// though the surrounding CSS module class names are build-hashed.
const readProductInfoPage = async (
  { page, navigateTo, logger }: CrawlContext,
  productUrl: string,
): Promise<{
  ingredientsRawText: string | null
  allergenText: string
  nutritionRows: NutritionRow[]
} | null> => {
  const infoUrl = buildProductInfoUrl(productUrl)
  if (!infoUrl) {
    logger.warn(`Could not derive product info URL for ${productUrl}`)
    return null
  }
  await navigateTo(infoUrl, PRODUCT_INFO_HEADING_SELECTOR)

  const infoItems = await page
    .locator(PRODUCT_INFO_HEADING_SELECTOR)
    .evaluateAll((headings) =>
      headings
        .map((heading): [string, string] => [
          heading.textContent?.trim() ?? '',
          heading.nextElementSibling?.textContent?.trim() ?? '',
        ])
        .filter(([label]) => label.length > 0),
    )
  if (!infoItems.length)
    logger.warn(`Product info page never rendered its content for ${productUrl}`)
  const infoMap = Object.fromEntries(infoItems)
  const nutritionRows = await readNutritionRows(page)

  return {
    ingredientsRawText: infoMap['Zutaten/Inhaltsstoffe'] || null,
    allergenText: infoMap['Allergene'] ?? '',
    nutritionRows,
  }
}

const scrapeProduct = async (context: CrawlContext, sourceUrl: string): Promise<CrawledProduct> => {
  const { page, logger, incompleteProducts, unmappedCategories } = context
  const productJsonLd = await readProductJsonLd(page)
  if (!productJsonLd) logger.warn(`No Product JSON-LD found for ${sourceUrl}`)

  const fullName = productJsonLd?.name ?? ''
  const brandAndName = extractBrandFromName(fullName)
  const brand = brandAndName?.brand ?? null
  const quantity = parseQuantityFromName(fullName)
  recordIncompleteProduct(logger, incompleteProducts, {
    sourceUrl,
    name: fullName,
    missingFieldNames: listMissingRequiredFieldNames({ brand, quantity }),
  })

  const productInfo = await readProductInfoPage(context, sourceUrl)
  if (!productInfo)
    logger.warn(`Product info page (ingredients/nutrition) not found for ${sourceUrl}`)

  const name = removeTrailingQuantity(brandAndName?.nameWithoutBrand ?? fullName)
  const description = productJsonLd?.description ?? null
  const { energyKilojoules, nutrientsPer100g } = parseNutritionRows(
    productInfo?.nutritionRows ?? [],
  )
  const category = resolveCategoryFromKeywords([name, description])

  if (!category) {
    recordUnmappedCategory(logger, unmappedCategories, { sourceUrl, name, hint: null })
  }

  return {
    site: 'wolt',
    sourceUrl,
    slug: extractSlugFromUrlPath(sourceUrl, PRODUCT_SLUG_PATH_SEGMENT_COUNT),
    name,
    brand,
    quantityUnit: quantity?.unit ?? null,
    quantityValue: quantity?.value ?? null,
    description,
    category,
    base: resolveBaseFromIngredients(productInfo?.ingredientsRawText ?? null),
    allergens: parseAllergens(productInfo?.allergenText ?? ''),
    isOrganic: /\bbio\b|\borganic\b/i.test(`${name} ${description ?? ''}`),
    barcode: null,
    energyKilojoules,
    nutrientsPer100g,
    ingredientsRawText: productInfo?.ingredientsRawText ?? null,
    priceEuroCents: productJsonLd?.priceEuroCents ?? 0,
    salePriceEuroCents: null,
    imageSourceUrl: productJsonLd?.imageSourceUrl ?? null,
    crawledAt: new Date().toISOString(),
    siteDetails: null,
  }
}

const collectProductUrls = async (
  { page, navigateTo }: CrawlContext,
  collectLimit: number | null,
): Promise<string[]> => {
  await navigateTo(LISTING_URL, PRODUCT_LINK_SELECTOR)
  return collectLinksByInfiniteScroll(page, {
    hrefPattern: PRODUCT_HREF_PATTERN,
    limit: collectLimit,
  })
}

export const createWoltCrawler = (): SiteCrawler => ({
  id: 'wolt',
  isProductUrl: (url) => PRODUCT_HREF_PATTERN.test(url),
  collectProductUrls,
  productPageSelector: PRODUCT_JSON_LD_SELECTOR,
  scrapeProduct,
})
