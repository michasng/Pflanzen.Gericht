import type { Page } from 'playwright'
import type { SiteCrawler, CrawlContext } from '../types.js'
import type { CrawledProduct } from '../../schema/crawledProduct.js'
import type { Allergen, KnownNutrientName } from '@pflanzen-gericht/contracts'
import { collectLinksByInfiniteScroll } from '../../shared/scraping/collectLinksByInfiniteScroll.js'
import { resolveCategoryFromKeywords } from '../../shared/categoryKeywordMapping.js'
import { parseQuantity } from '../../shared/parsing/parseQuantity.js'
import { parseEuroCents } from '../../shared/parsing/parseEuroCents.js'
import type { ParsedNutrition } from '../../shared/parsing/parsedNutrition.js'
import { listMissingRequiredFieldNames } from '../../shared/parsing/listMissingRequiredFieldNames.js'
import { recordIncompleteProduct } from '../../shared/logging/recordIncompleteProduct.js'
import { recordUnmappedCategory } from '../../shared/logging/recordUnmappedCategory.js'
import { extractSlugFromUrlPath } from '../../shared/output/extractSlugFromUrlPath.js'

// The user only wants meat/fish/egg alternatives and the plant-based fridge
// category - the broader "plant-based" diet filter also includes fruit,
// bread, drinks, baby food and beauty products.
const LISTING_URLS = [
  'https://www.knuspr.de/c2423-fleisch-fisch-wurst-ei-alternativen/diet/vegan-items',
  'https://www.knuspr.de/c2430-pflanzenbasiertes-kuehlregal/diet/vegan-items',
]
// Knuspr product detail URLs start with a numeric product id, e.g. /28605-...
const PRODUCT_HREF_PATTERN = /^https:\/\/www\.knuspr\.de\/\d+-[^/]+$/
const PRODUCT_SLUG_PATH_SEGMENT_COUNT = 1
const SHOW_ALL_BUTTON_SELECTOR = 'button:has-text("Alles anzeigen")'
const PRODUCT_CARD_SELECTOR = '[data-test="productCard"]'
const PRODUCT_NAME_SELECTOR = '[data-test="product-detail-product-name"]'

const NUTRIENT_LABEL_PATTERNS: readonly (readonly [KnownNutrientName, RegExp])[] = [
  ['Fett', /^fett\b/i],
  ['Gesättigte Fettsäuren', /gesättigte fettsäuren/i],
  ['Kohlenhydrate', /^kohlenhydrate\b/i],
  ['Zucker', /^(davon )?zucker\b/i],
  ['Ballaststoffe', /ballaststoffe/i],
  ['Eiweiß', /eiwei(ß|ss)/i],
  ['Salz', /^salz\b/i],
]
const ENERGY_LABEL_PATTERN = /^energie\b/i
const ENERGY_KILOJOULE_PATTERN = /(\d+[.,]\d+|\d+)\s*kJ\b/

const ALLERGEN_TEXT_PATTERNS: readonly (readonly [Allergen, RegExp])[] = [
  ['gluten', /gluten/i],
  ['soy', /soja/i],
  ['nuts', /(schalenfr[üu]chte|n[üu]sse)/i],
]

const parseGrams = (line: string): number | null => {
  const match = /(\d+[.,]\d+|\d+)\s*g\b/.exec(line)
  const digits = match?.[1]
  return digits ? Number.parseFloat(digits.replace(',', '.')) : null
}

const parseNutritionFacts = (nutritionText: string): ParsedNutrition => {
  const lines = nutritionText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const nutrientsPer100g: Partial<Record<KnownNutrientName, number>> = {}
  for (const [name, pattern] of NUTRIENT_LABEL_PATTERNS) {
    const line = lines.find((candidate) => pattern.test(candidate))
    const grams = line ? parseGrams(line) : null
    if (grams !== null) nutrientsPer100g[name] = grams
  }
  const energyLineIndex = lines.findIndex((line) => ENERGY_LABEL_PATTERN.test(line))
  const energyValueLine = energyLineIndex >= 0 ? lines[energyLineIndex + 1] : undefined
  const energyKilojoules = energyValueLine
    ? Number.parseFloat(
        (ENERGY_KILOJOULE_PATTERN.exec(energyValueLine)?.[1] ?? '').replace(',', '.'),
      )
    : Number.NaN
  return {
    energyKilojoules: Number.isFinite(energyKilojoules) ? energyKilojoules : null,
    nutrientsPer100g,
  }
}

const parseAllergens = (allergenText: string): Allergen[] =>
  ALLERGEN_TEXT_PATTERNS.filter(([, pattern]) => pattern.test(allergenText)).map(
    ([allergen]) => allergen,
  )

const readSectionByHeading = async (
  page: Page,
  containerSelector: string,
  headingText: string,
): Promise<string> => {
  const container = page.locator(containerSelector)
  if (!(await container.count())) return ''
  const heading = container.locator('h3', { hasText: headingText }).first()
  if (!(await heading.count())) return ''
  return (
    (await heading
      .locator('xpath=following-sibling::*[1]')
      .innerText()
      .catch(() => '')) ?? ''
  )
}

const scrapeProduct = async (
  { page, logger, incompleteProducts, unmappedCategories }: CrawlContext,
  sourceUrl: string,
): Promise<CrawledProduct> => {
  const name = await page
    .locator(PRODUCT_NAME_SELECTOR)
    .first()
    .innerText()
    .catch(() => '')
  const brand = await page
    .locator('[data-test="product-detail-brand-name"] p')
    .first()
    .innerText()
    .catch(() => null)
  const quantityText = await page
    .locator('[data-test="product-detail-weight-info"] span')
    .first()
    .innerText()
    .catch(() => '')
  const quantity = parseQuantity(quantityText)
  recordIncompleteProduct(logger, incompleteProducts, {
    sourceUrl,
    name,
    missingFieldNames: listMissingRequiredFieldNames({ brand, quantity }),
  })
  const priceText = await page
    .locator('[data-test="product-detail-price-section"] meta[itemprop="price"]')
    .first()
    .getAttribute('content')
    .catch(() => null)
  const breadcrumbNames = await page
    .locator('[data-test="product-detail-breadcrumbs"] a')
    .allInnerTexts()
    .catch(() => [])
  const imageUrl = await page
    .locator('[data-test="product-detail-gallery"] img')
    .first()
    .getAttribute('src')
    .catch(() => null)

  const ingredientsRawText =
    (await readSectionByHeading(
      page,
      '[data-test="product-detail-ingredients-allergens"]',
      'Zusammensetzung',
    )) || null
  const allergenText = await readSectionByHeading(
    page,
    '[data-test="product-detail-ingredients-allergens"]',
    'Allergene',
  )
  const nutritionText = await page
    .locator('[data-test="product-detail-nutrition-facts"]')
    .innerText()
    .catch(() => '')
  const { energyKilojoules, nutrientsPer100g } = parseNutritionFacts(nutritionText)
  // The product name is more specific than the breadcrumbs, which can be
  // broad listing buckets (e.g. "Fleisch, Fisch, Wurst & Ei Alternativen")
  // that happen to contain unrelated keywords, so it is checked first.
  const category = resolveCategoryFromKeywords([name, ...breadcrumbNames])

  if (!category) {
    recordUnmappedCategory(logger, unmappedCategories, {
      sourceUrl,
      name,
      hint: breadcrumbNames.join(' > ') || null,
    })
  }

  return {
    site: 'knuspr',
    sourceUrl,
    slug: extractSlugFromUrlPath(sourceUrl, PRODUCT_SLUG_PATH_SEGMENT_COUNT),
    name,
    brand: brand || null,
    quantityUnit: quantity?.unit ?? null,
    quantityValue: quantity?.value ?? null,
    description: null,
    category,
    base: null,
    allergens: parseAllergens(allergenText),
    isOrganic: /\bbio\b/i.test(name),
    barcode: null,
    energyKilojoules,
    nutrientsPer100g,
    ingredientsRawText,
    priceEuroCents: parseEuroCents(priceText),
    salePriceEuroCents: null,
    imageSourceUrl: imageUrl,
    crawledAt: new Date().toISOString(),
    siteDetails: null,
  }
}

const collectProductUrls = async (
  { page, navigateTo }: CrawlContext,
  collectLimit: number | null,
): Promise<string[]> => {
  const productUrls = new Set<string>()

  for (const listingUrl of LISTING_URLS) {
    await navigateTo(listingUrl, PRODUCT_CARD_SELECTOR)

    const showAllButton = page.locator(SHOW_ALL_BUTTON_SELECTOR)
    const showAllButtonCount = await showAllButton.count()
    for (let index = 0; index < showAllButtonCount; index += 1) {
      await showAllButton
        .nth(index)
        .click()
        .catch(() => undefined)
    }

    const listingProductUrls = await collectLinksByInfiniteScroll(page, {
      hrefPattern: PRODUCT_HREF_PATTERN,
      limit: collectLimit === null ? null : collectLimit - productUrls.size,
    })
    for (const productUrl of listingProductUrls) productUrls.add(productUrl)
    if (collectLimit !== null && productUrls.size >= collectLimit) break
  }

  return [...productUrls]
}

export const createKnusprCrawler = (): SiteCrawler => ({
  id: 'knuspr',
  isProductUrl: (url) => PRODUCT_HREF_PATTERN.test(url),
  collectProductUrls,
  productPageSelector: PRODUCT_NAME_SELECTOR,
  scrapeProduct,
})
