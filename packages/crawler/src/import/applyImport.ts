import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../../src/types/database.js'
import type { CrawledProduct, SiteId } from '../schema/crawledProduct.js'
import { convertGramsToMicrograms } from '../schema/convertGramsToMicrograms.js'
import { convertKilojoulesToJoules } from '../schema/convertKilojoulesToJoules.js'
import type { DiffEntry } from './diffProduct.js'
import { buildIngredientRows } from './buildIngredientRows.js'
import type { FieldDecision } from './promptDecisions.js'
import type { RequiredProductFields } from './resolveRequiredProductFields.js'
import { buildImageVariantPaths, uploadProductImageFromFile } from './uploadImageVariants.js'
import { findProductImagePath } from '../shared/output/outputPaths.js'

type ProductUpdate = Database['public']['Tables']['product']['Update']

const STORE_NAME_BY_SITE: Record<SiteId, string> = { rewe: 'REWE', knuspr: 'Knuspr', wolt: 'Wolt' }

const buildNutrientRows = (candidate: CrawledProduct, productId: string) =>
  Object.entries(candidate.nutrientsPer100g).map(([name, grams]) => ({
    product_id: productId,
    name,
    amount_micrograms: convertGramsToMicrograms(grams),
  }))

const attachImageIfAvailable = async (
  supabase: SupabaseClient<Database>,
  productId: string,
  userId: string,
  candidate: CrawledProduct,
): Promise<void> => {
  const imagePath = await findProductImagePath(candidate.site, candidate.slug)
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
      energy_joules: convertKilojoulesToJoules(candidate.energyKilojoules),
      allergens: candidate.allergens,
      is_organic: candidate.isOrganic,
      barcode: candidate.barcode,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error) throw error

  const productId = data.id as string
  const ingredientRows = buildIngredientRows(candidate.ingredientsRawText, productId)
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
  if (overriddenFieldNames.has('energyJoules'))
    updates.energy_joules = convertKilojoulesToJoules(candidate.energyKilojoules)
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
    const rows = buildIngredientRows(candidate.ingredientsRawText, productId)
    if (rows.length) await supabase.from('product_ingredient').insert(rows)
  }

  if (overriddenFields.some((entry) => entry.field === 'nutrientsMicrograms')) {
    await supabase.from('product_nutrient').delete().eq('product_id', productId)
    const rows = buildNutrientRows(candidate, productId)
    if (rows.length) await supabase.from('product_nutrient').insert(rows)
  }
}

export const replaceProductImages = async (
  supabase: SupabaseClient<Database>,
  productId: string,
  userId: string,
  candidate: CrawledProduct,
): Promise<void> => {
  const imagePath = await findProductImagePath(candidate.site, candidate.slug)
  if (!imagePath) return

  const { data: previousImages, error: selectError } = await supabase
    .from('product_image')
    .select('id, storage_path')
    .eq('product_id', productId)
  if (selectError) throw selectError

  await uploadProductImageFromFile(supabase, productId, userId, imagePath, 0)
  if (!previousImages.length) return

  const { error: deleteError } = await supabase
    .from('product_image')
    .delete()
    .in(
      'id',
      previousImages.map((image) => image.id),
    )
  if (deleteError) throw deleteError

  const { error: removeError } = await supabase.storage
    .from('product-images')
    .remove(previousImages.flatMap((image) => buildImageVariantPaths(image.storage_path)))
  if (removeError) throw removeError
}

export const insertProductSource = async (
  supabase: SupabaseClient<Database>,
  productId: string,
  sourceUrl: string,
): Promise<void> => {
  const { error } = await supabase
    .from('product_source')
    .upsert(
      { product_id: productId, url: sourceUrl },
      { onConflict: 'product_id,url', ignoreDuplicates: true },
    )
  if (error) throw error
}

export const upsertPriceReport = async (
  supabase: SupabaseClient<Database>,
  productId: string,
  userId: string,
  cityName: string,
  candidate: CrawledProduct,
): Promise<void> => {
  const { error } = await supabase.from('price_report').upsert(
    {
      product_id: productId,
      user_id: userId,
      store: STORE_NAME_BY_SITE[candidate.site],
      city_name: cityName,
      price_euro_cents: candidate.priceEuroCents,
      sale_price_euro_cents: candidate.salePriceEuroCents,
      observed_at: new Date().toISOString(),
    },
    { onConflict: 'product_id,user_id,store,city_name' },
  )
  if (error) throw error
}
