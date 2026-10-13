import type {
  Allergen,
  Base,
  Category,
  KnownNutrientName,
  QuantityUnit,
} from '@pflanzen-gericht/contracts'

export type SiteId = 'rewe' | 'knuspr' | 'wolt'

// The one contract shared between independent site crawlers and the consolidate CLI.
// A site crawler writes one of these (as JSON) plus a sibling image file per product.
export interface CrawledProduct<SiteDetails = unknown> {
  site: SiteId
  sourceUrl: string
  name: string
  brand: string | null
  quantityUnit: QuantityUnit | null
  /** whole number in quantityUnit */
  quantityValue: number | null
  description: string | null
  category: Category | null
  base: Base | null
  allergens: Allergen[]
  isOrganic: boolean
  barcode: string | null
  energyKilojoules: number | null
  /** grams per 100g, keyed by the app's known nutrient display names */
  nutrientsPer100g: Partial<Record<KnownNutrientName, number>>
  ingredientsRawText: string | null
  priceEuroCents: number
  salePriceEuroCents: number | null
  imageSourceUrl: string | null
  crawledAt: string
  /** properties only meaningful to the originating site's crawler, e.g. to retry category mapping later */
  siteDetails: SiteDetails
}
