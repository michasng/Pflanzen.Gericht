import type { Page } from 'playwright'
import type { SiteCrawler, CrawlContext } from '../types.js'
import type { CrawledProduct } from '../../schema/crawledProduct.js'
import type { Allergen, KnownNutrientName } from '@pflanzen-gericht/contracts'
import { parseMultipackQuantity } from '../../shared/parsing/parseMultipackQuantity.js'
import { listMissingRequiredFieldNames } from '../../shared/parsing/listMissingRequiredFieldNames.js'
import type { ParsedNutrition } from '../../shared/parsing/parsedNutrition.js'
import { recordIncompleteProduct } from '../../shared/logging/recordIncompleteProduct.js'
import { recordUnmappedCategory } from '../../shared/logging/recordUnmappedCategory.js'
import {
  collectProductUrlsFromListings,
  type ListingPage,
} from './collectProductUrlsFromListings.js'
import { resolveCategoryFromSlug } from './resolveCategoryFromSlug.js'
import { resolveBaseFromIngredients } from '../../shared/resolveBaseFromIngredients.js'
import { cleanReweProductName } from './cleanReweProductName.js'
import { extractReweProductSlug } from './extractReweProductSlug.js'
import type { ReweSiteDetails } from './reweSiteDetails.js'

// Only dedicated vegan sections: the global vegan filter also lists coincidentally vegan items like spices.
const LISTING_URLS = [
  'fleisch-wurst-fisch',
  'kaese-eier-molkerei',
  'eiscreme-eiswuerfel',
  'pizza-baguettes',
  'tiefkuehl-fertiggerichte',
  'tiefkuehl-backwaren',
  'kuchen-torten-gebaeck',
  'suesse-brotaufstriche',
  'herzhafte-aufstriche-dips',
  'frucht-muesliriegel',
  'fertiggerichte',
  'suppen-eintoepfe',
  'fixprodukte',
  'instant-snacks',
  'bouillons-bruehen',
  'dosengerichte',
  'gekuehlte-nudeln-teigwaren',
  'suesses-salziges',
].map((categorySlug) => `https://www.rewe.de/shop/c/${categorySlug}/?attribute=vegan`)
const LOAD_MORE_LINK_SELECTOR = 'a.plr-Category__LoadMoreButton'
const PRODUCT_HREF_PATTERN = /^https:\/\/www\.rewe\.de\/shop\/p\/[^/]+\/\d+$/
const PAGINATION_ITEM_SELECTOR = '.plr-pagination-item'
const PRODUCT_TILE_SELECTOR = '.plrProductGrid li:not(.plrProductGrid__flagship)'
const PRODUCT_TRACKING_SCRIPT_SELECTOR = 'script[data-tracking-type="product"]'
const PRODUCT_GRID_SELECTOR = '.plrProductGrid'
const PROP_STORE_SELECTOR = 'script[id^="pdpr-propstore"]'

// REWE embeds the full product record as JSON right in the page - far more
// reliable than scraping visible DOM text, which uses CSS-module hashed classes.
interface ReweNutrientInformation {
  nutrientType: { code: string }
  quantityContained: { value: number; uom: string }
}

interface ReweNutritionFacts {
  servingSize: { value: number; uom: string }
  nutrientInformation: ReweNutrientInformation[]
}

interface ReweAttribute {
  name: string
  value: string
}

interface RewePropStore {
  productData: {
    productName: string
    regulatedProductName: string | null
    featureBenefit: string[] | null
    tradeItemMarketingMessage: string | null
    brandKey: string | null
    categorySlug: string | null
    bio: boolean
    gtin: string | null
    mediaInformation: { mediaUrl: string }[]
    nutritionFacts: ReweNutritionFacts[]
    attributeGroups: { attributes: ReweAttribute[] }[]
    pricing: { price: number; regularPrice: number; grammage: string | null }
  }
}

const NUTRIENT_CODE_MAP: Readonly<Record<string, KnownNutrientName>> = {
  FAT: 'Fett',
  FASAT: 'Gesättigte Fettsäuren',
  CHOAVL: 'Kohlenhydrate',
  'SUGAR-': 'Zucker',
  FIBTG: 'Ballaststoffe',
  'PRO-': 'Eiweiß',
  SALTEQ: 'Salz',
}
const ENERGY_KILOJOULE_CODE = 'ENER-'
const ENERGY_KILOJOULE_UOM = 'KJO'

// EU labelling law requires allergenic ingredients to be printed in capitals
// within the ingredient list, so REWE has no separate allergens field.
const ALLERGEN_CAPS_PATTERNS: readonly (readonly [Allergen, RegExp])[] = [
  ['gluten', /\b(WEIZEN|GERSTE|HAFER|ROGGEN|DINKEL|GLUTEN)\w*\b/],
  ['soy', /\bSOJA\w*\b/],
  // Compound stems (ERDNUSS, HASELNUSS, ...) are listed explicitly so KOKOSNUSS/MUSKATNUSS don't match.
  ['nuts', /\b(N[ÜU]SS|(ERD|HASEL|WAL|PEKAN|PARA)N[ÜU]SS|MANDEL|CASHEW|PISTAZIE|MACADAMIA)\w*\b/],
]

const parseAllergensFromIngredients = (ingredientsRawText: string): Allergen[] =>
  ALLERGEN_CAPS_PATTERNS.filter(([, pattern]) => pattern.test(ingredientsRawText)).map(
    ([allergen]) => allergen,
  )

const buildDescription = (productData: RewePropStore['productData'] | null): string | null => {
  const featureBullets = (productData?.featureBenefit ?? []).map((feature) => `- ${feature}`)
  const paragraphs = [
    productData?.regulatedProductName,
    featureBullets.join('\n'),
    productData?.tradeItemMarketingMessage,
  ].filter((paragraph): paragraph is string => Boolean(paragraph))
  return paragraphs.length ? paragraphs.join('\n\n') : null
}

const readPropStore = async (page: Page): Promise<RewePropStore | null> => {
  const rawJson = await page
    .locator(PROP_STORE_SELECTOR)
    .first()
    .textContent()
    .catch(() => null)
  if (!rawJson) return null
  try {
    return JSON.parse(rawJson) as RewePropStore
  } catch {
    return null
  }
}

const parseNutrientsPer100g = (nutritionFacts: ReweNutritionFacts[]): ParsedNutrition => {
  const per100g = nutritionFacts.find(
    (facts) => facts.servingSize.value === 100 && facts.servingSize.uom === 'GR',
  )
  const nutrientsPer100g: Partial<Record<KnownNutrientName, number>> = {}
  let energyKilojoules: number | null = null
  for (const info of per100g?.nutrientInformation ?? []) {
    if (
      info.nutrientType.code === ENERGY_KILOJOULE_CODE &&
      info.quantityContained.uom === ENERGY_KILOJOULE_UOM
    ) {
      energyKilojoules = info.quantityContained.value
      continue
    }
    const nutrientName = NUTRIENT_CODE_MAP[info.nutrientType.code]
    if (nutrientName) nutrientsPer100g[nutrientName] = info.quantityContained.value
  }
  return { energyKilojoules, nutrientsPer100g }
}

// Grammage reads like "400g (1 kg = 8,48 €)"; only the part before the base price is the pack size.
const parseGrammageSize = (grammage: string | null | undefined): string =>
  (grammage ?? '').split('(')[0] ?? ''

const scrapeProduct = async (
  { page, logger, incompleteProducts, unmappedCategories }: CrawlContext,
  sourceUrl: string,
): Promise<CrawledProduct<ReweSiteDetails>> => {
  const propStore = await readPropStore(page)
  const productData = propStore?.productData ?? null
  const productName = productData?.productName ?? ''
  const brand = productData?.brandKey ?? null
  const name = cleanReweProductName(productName, brand)
  const quantity = parseMultipackQuantity(parseGrammageSize(productData?.pricing.grammage))
  recordIncompleteProduct(logger, incompleteProducts, {
    sourceUrl,
    name,
    missingFieldNames: listMissingRequiredFieldNames({ brand, quantity }),
  })
  const ingredientsAttribute = productData?.attributeGroups
    .flatMap((group) => group.attributes)
    .find((attribute) => attribute.name === 'ingredientStatement')
  const ingredientsRawText = ingredientsAttribute?.value ?? null
  const { energyKilojoules, nutrientsPer100g } = parseNutrientsPer100g(
    productData?.nutritionFacts ?? [],
  )
  const categorySlug = productData?.categorySlug ?? null
  const category = resolveCategoryFromSlug(categorySlug)

  if (!category) {
    recordUnmappedCategory(logger, unmappedCategories, { sourceUrl, name, hint: categorySlug })
  }

  const price = productData?.pricing.price ?? 0
  const regularPrice = productData?.pricing.regularPrice ?? price
  const isOnSale = price < regularPrice

  return {
    site: 'rewe',
    sourceUrl,
    slug: extractReweProductSlug(sourceUrl),
    name,
    brand,
    quantityUnit: quantity?.unit ?? null,
    quantityValue: quantity?.value ?? null,
    description: buildDescription(productData),
    category,
    base: resolveBaseFromIngredients(ingredientsRawText),
    allergens: ingredientsRawText ? parseAllergensFromIngredients(ingredientsRawText) : [],
    isOrganic: productData?.bio ?? false,
    barcode: productData?.gtin ?? null,
    energyKilojoules,
    nutrientsPer100g,
    ingredientsRawText,
    priceEuroCents: isOnSale ? regularPrice : price,
    salePriceEuroCents: isOnSale ? price : null,
    imageSourceUrl: productData?.mediaInformation[0]?.mediaUrl ?? null,
    crawledAt: new Date().toISOString(),
    siteDetails: { categorySlug },
  }
}

const discoverLastPageNumber = async (page: Page): Promise<number> => {
  const pageNumbers = await page.$$eval(PAGINATION_ITEM_SELECTOR, (items) =>
    items
      .map((item) => /Seite (\d+)/.exec(item.getAttribute('aria-label') ?? '')?.[1])
      .filter((match): match is string => Boolean(match))
      .map(Number),
  )
  return pageNumbers.length ? Math.max(...pageNumbers) : 1
}

const collectNonSponsoredProductUrls = async (page: Page): Promise<string[]> =>
  page.$$eval(
    PRODUCT_TILE_SELECTOR,
    (tiles, { trackingScriptSelector, baseUrl }) =>
      tiles.flatMap((tile) => {
        const trackingScript = tile.querySelector(trackingScriptSelector)
        const anchor = tile.querySelector('a[href*="/shop/p/"]')
        const rawHref = anchor?.getAttribute('href')
        if (!trackingScript || !rawHref) return []
        try {
          const tracking = JSON.parse(trackingScript.textContent ?? '') as { sponsored?: string }
          // tile anchors use a page-relative href; resolve it to absolute so PRODUCT_HREF_PATTERN can match.
          return tracking.sponsored === 'true' ? [] : [new URL(rawHref, baseUrl).toString()]
        } catch {
          return []
        }
      }),
    { trackingScriptSelector: PRODUCT_TRACKING_SCRIPT_SELECTOR, baseUrl: page.url() },
  )

const collectLoadMoreUrls = async (page: Page): Promise<string[]> =>
  page.$$eval(
    LOAD_MORE_LINK_SELECTOR,
    (links, baseUrl) =>
      links.flatMap((link) => {
        const rawHref = link.getAttribute('href')
        return rawHref ? [new URL(rawHref, baseUrl).toString()] : []
      }),
    page.url(),
  )

const collectProductUrls = async (
  { page, navigateTo }: CrawlContext,
  collectLimit: number | null,
): Promise<string[]> => {
  const readListingPage = async (listingUrl: string): Promise<ListingPage> => {
    await navigateTo(listingUrl, PRODUCT_GRID_SELECTOR)
    const productUrls = (await collectNonSponsoredProductUrls(page)).filter((url) =>
      PRODUCT_HREF_PATTERN.test(url),
    )
    return {
      productUrls,
      loadMoreUrls: await collectLoadMoreUrls(page),
      lastPageNumber: await discoverLastPageNumber(page),
    }
  }

  return collectProductUrlsFromListings({
    listingUrls: LISTING_URLS,
    limit: collectLimit,
    readListingPage,
  })
}

export const createReweCrawler = (): SiteCrawler => ({
  id: 'rewe',
  isProductUrl: (url) => PRODUCT_HREF_PATTERN.test(url),
  collectProductUrls,
  productPageSelector: PROP_STORE_SELECTOR,
  scrapeProduct,
})
