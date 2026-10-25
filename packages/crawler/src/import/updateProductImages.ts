import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../../src/types/database.js'
import type { CrawledProduct } from '../schema/crawledProduct.js'
import { findProductImagePath } from '../shared/output/outputPaths.js'
import { replaceProductImages } from './applyImport.js'
import { askImageDecision } from './promptDecisions.js'

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

export const updateProductImages = async (
  supabase: SupabaseClient<Database>,
  productId: string,
  userId: string,
  product: CrawledProduct,
  shouldOverrideAll: boolean,
): Promise<void> => {
  const localImagePath = await findProductImagePath(product.site, product.slug)
  if (!localImagePath) return

  if (!shouldOverrideAll) {
    const existingImageUrl = await getExistingImageUrl(supabase, productId)
    const decision = await askImageDecision(existingImageUrl, localImagePath)
    if (decision !== 'override') return
  }
  await replaceProductImages(supabase, productId, userId, product)
}
