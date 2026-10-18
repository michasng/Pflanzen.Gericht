import { toProductFormValues } from '@/lib/toProductFormValues'
import type { ProductEditingGateway } from '@/services/ProductEditingGateway'
import type { MergeSource } from '@/types/MergeSource'

export const UNKNOWN_OWNER_NAME = 'Unbekannt'

export const loadMergeSource = async (
  gateway: ProductEditingGateway,
  productId: string,
): Promise<MergeSource> => {
  const [product, images, ingredients, nutrients, sources, counts] = await Promise.all([
    gateway.fetchProduct(productId),
    gateway.fetchProductImages(productId),
    gateway.fetchProductIngredients(productId),
    gateway.fetchProductNutrients(productId),
    gateway.fetchProductSources(productId),
    gateway.fetchProductActivityCounts(productId),
  ])
  if (!product) throw new Error('Produkt nicht gefunden.')
  const profile = await gateway.fetchPublicProfile(product.createdBy)
  return {
    product,
    images,
    values: toProductFormValues(product, ingredients, nutrients, sources),
    ownerName: profile?.displayName || profile?.username || UNKNOWN_OWNER_NAME,
    ...counts,
  }
}
