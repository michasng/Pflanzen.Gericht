import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../../src/types/database.js'
import type { CrawledProduct, SiteId } from '../schema/crawledProduct.js'
import { MICROGRAMS_PER_GRAM, JOULES_PER_KILOJOULE } from '../schema/units.js'
import type { ConsolidatedCandidate } from './candidate.js'
import type { DiffEntry } from './diffProduct.js'
import type { FieldDecision } from './promptDecisions.js'
import type { RequiredProductFields } from './resolveRequiredProductFields.js'
import { uploadProductImageFromFile } from './uploadImageVariants.js'
import { findProductImagePath } from '../shared/output/outputPaths.js'
import { slugifyProductName } from '../shared/output/slugifyProductName.js'

type ProductUpdate = Database['public']['Tables']['product']['Update']

const STORE_NAME_BY_SITE: Record<SiteId, string> = { rewe: 'REWE', knuspr: 'Knuspr', wolt: 'Wolt' }

const buildIngredientRows = (candidate: CrawledProduct, productId: string) =>
  candidate.ingredientsRawText
    ? [
        {
          product_id: productId,
          name: candidate.ingredientsRawText,
          comparator: '=',
          fraction_basis_points: null,
        },
      ]
    : []

const buildNutrientRows = (candidate: CrawledProduct, productId: string) =>
  Object.entries(candidate.nutrientsPer100g).map(([name, grams]) => ({
    product_id: productId,
    name,
    amount_micrograms: grams * MICROGRAMS_PER_GRAM,
  }))

const attachImageIfAvailable = async (
  supabase: SupabaseClient<Database>,
  productId: string,
  userId: string,
  candidate: CrawledProduct,
): Promise<void> => {
  const imagePath = await findProductImagePath(candidate.site, slugifyProductName(candidate.name))
  if (imagePath) await uploadProductImageFromFile(supabase, productId, userId, imagePath, 0)
}

export const createNewProduct = async (
  supabase: SupabaseClient<Database>,
  candidate: CrawledProduct,
  { category, brand, quantityUnit, quantityValue }: RequiredProductFields,
  userId: string,
): Promise<string> => {
  const { data, error } = await supabase
    .from('product')
    .insert({
      name: candidate.name,
      category,
      base: candidate.base,
      brand,
      quantity_unit: quantityUnit,
      quantity_value: quantityValue,
      description: candidate.description,
      energy_joules:
        candidate.energyKilojoules !== null
          ? candidate.energyKilojoules * JOULES_PER_KILOJOULE
          : null,
      allergens: candidate.allergens,
      is_organic: candidate.isOrganic,
      barcode: candidate.barcode,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error) throw error

  const productId = data.id as string
  const ingredientRows = buildIngredientRows(candidate, productId)
  const nutrientRows = buildNutrientRows(candidate, productId)
  if (ingredientRows.length) {
    const { error: ingredientError } = await supabase
      .from('product_ingredient')
      .insert(ingredientRows)
    if (ingredientError) throw ingredientError
  }
  if (nutrientRows.length) {
    const { error: nutrientError } = await supabase.from('product_nutrient').insert(nutrientRows)
    if (nutrientError) throw nutrientError
  }
  await attachImageIfAvailable(supabase, productId, userId, candidate)
  return productId
}

const buildProductColumnUpdates = (
  candidate: CrawledProduct,
  overriddenFieldNames: Set<string>,
): ProductUpdate => {
  const updates: ProductUpdate = {}
  if (overriddenFieldNames.has('name')) updates.name = candidate.name
  if (overriddenFieldNames.has('brand') && candidate.brand) updates.brand = candidate.brand
  if (overriddenFieldNames.has('quantityUnit') && candidate.quantityUnit)
    updates.quantity_unit = candidate.quantityUnit
  if (overriddenFieldNames.has('quantityValue') && candidate.quantityValue !== null)
    updates.quantity_value = candidate.quantityValue
  if (overriddenFieldNames.has('description')) updates.description = candidate.description
  if (overriddenFieldNames.has('category') && candidate.category)
    updates.category = candidate.category
  if (overriddenFieldNames.has('base')) updates.base = candidate.base
  if (overriddenFieldNames.has('allergens')) updates.allergens = candidate.allergens
  if (overriddenFieldNames.has('isOrganic')) updates.is_organic = candidate.isOrganic
  if (overriddenFieldNames.has('barcode')) updates.barcode = candidate.barcode
  if (overriddenFieldNames.has('energyJoules')) {
    updates.energy_joules =
      candidate.energyKilojoules !== null ? candidate.energyKilojoules * JOULES_PER_KILOJOULE : null
  }
  return updates
}

export const applyOverrideDecisions = async (
  supabase: SupabaseClient<Database>,
  productId: string,
  candidate: CrawledProduct,
  diffEntries: DiffEntry[],
  decisions: Map<string, FieldDecision>,
): Promise<void> => {
  const overriddenFields = diffEntries.filter((entry) => decisions.get(entry.field) === 'override')
  if (!overriddenFields.length) return

  const columnUpdates = buildProductColumnUpdates(
    candidate,
    new Set(overriddenFields.map((entry) => entry.field)),
  )
  if (Object.keys(columnUpdates).length) {
    const { error } = await supabase.from('product').update(columnUpdates).eq('id', productId)
    if (error) throw error
  }

  if (overriddenFields.some((entry) => entry.field === 'ingredientsSummary')) {
    await supabase.from('product_ingredient').delete().eq('product_id', productId)
    const rows = buildIngredientRows(candidate, productId)
    if (rows.length) await supabase.from('product_ingredient').insert(rows)
  }

  if (overriddenFields.some((entry) => entry.field === 'nutrientsMicrograms')) {
    await supabase.from('product_nutrient').delete().eq('product_id', productId)
    const rows = buildNutrientRows(candidate, productId)
    if (rows.length) await supabase.from('product_nutrient').insert(rows)
  }
}

export const applyImageOverride = async (
  supabase: SupabaseClient<Database>,
  productId: string,
  userId: string,
  candidate: CrawledProduct,
): Promise<void> => {
  await attachImageIfAvailable(supabase, productId, userId, candidate)
}

export const insertProductSources = async (
  supabase: SupabaseClient<Database>,
  productId: string,
  candidate: ConsolidatedCandidate,
): Promise<void> => {
  const urls = new Set(candidate.prices.map((price) => price.sourceUrl))
  const rows = [...urls].map((url) => ({ product_id: productId, url }))
  const { error } = await supabase
    .from('product_source')
    .upsert(rows, { onConflict: 'product_id,url', ignoreDuplicates: true })
  if (error) throw error
}

export const insertPriceReportsForCandidate = async (
  supabase: SupabaseClient<Database>,
  productId: string,
  userId: string,
  cityName: string,
  candidate: ConsolidatedCandidate,
): Promise<void> => {
  const observedAt = new Date().toISOString()
  for (const price of candidate.prices) {
    const { error } = await supabase.from('price_report').upsert(
      {
        product_id: productId,
        user_id: userId,
        store: STORE_NAME_BY_SITE[price.site],
        city_name: cityName,
        price_euro_cents: price.priceEuroCents,
        sale_price_euro_cents: price.salePriceEuroCents,
        observed_at: observedAt,
      },
      { onConflict: 'product_id,user_id,store,city_name' },
    )
    if (error) throw error
  }
}
