import type {
  Allergen,
  Base,
  Category,
  KnownNutrientName,
  QuantityUnit,
} from '@pflanzen-gericht/contracts'

export type SiteId = 'rewe' | 'knuspr' | 'wolt'

export interface CrawledProduct<SiteDetails = unknown> {
  site: SiteId
  sourceUrl: string
  slug: string
  name: string
  brand: string | null
  quantityUnit: QuantityUnit | null
  quantityValue: number | null
  description: string | null
  category: Category | null
  base: Base | null
  allergens: Allergen[]
  isOrganic: boolean
  barcode: string | null
  energyKilojoules: number | null
  nutrientsPer100g: Partial<Record<KnownNutrientName, number>>
  ingredientsRawText: string | null
  priceEuroCents: number
  salePriceEuroCents: number | null
  imageSourceUrl: string | null
  crawledAt: string
  siteDetails: SiteDetails
}
