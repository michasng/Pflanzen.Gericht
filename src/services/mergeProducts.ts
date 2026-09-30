import { resolveMergedPriceReports } from '@/lib/resolveMergedPriceReports'
import { resolveMergedReviews } from '@/lib/resolveMergedReviews'
import { resolveMergedSimilarityVotes } from '@/lib/resolveMergedSimilarityVotes'
import type { ProductMergeGateway } from '@/services/ProductMergeGateway'
import type { Product, ProductImage } from '@/types'
import type { ProductFormValues } from '@/types/productForm'

export interface MergeProductsInput {
  productIds: [string, string]
  values: ProductFormValues
  acceptedImages: ProductImage[]
  ownerId: string
}

const copyAll = async <T>(items: T[], copy: (item: T) => Promise<void>): Promise<void> => {
  for (const item of items) await copy(item)
}

const fillMergedProduct = async (
  gateway: ProductMergeGateway,
  mergedProduct: Product,
  { productIds, values, acceptedImages, ownerId }: MergeProductsInput,
): Promise<void> => {
  await gateway.replaceIngredients(mergedProduct.id, values.ingredients)
  await gateway.replaceNutrients(mergedProduct.id, values.nutrients)
  await copyAll(acceptedImages, (image) =>
    gateway.copyImage(image, ownerId, mergedProduct.id, acceptedImages.indexOf(image)),
  )

  const reviews = (await Promise.all(productIds.map((id) => gateway.fetchReviews(id)))).flat()
  await copyAll(resolveMergedReviews(reviews), (review) =>
    gateway.copyReview(review, mergedProduct.id),
  )

  const priceReports = (
    await Promise.all(productIds.map((id) => gateway.fetchPriceReports(id)))
  ).flat()
  await copyAll(resolveMergedPriceReports(priceReports), (report) =>
    gateway.copyPriceReport(report, mergedProduct.id),
  )

  const votes = (await Promise.all(productIds.map((id) => gateway.fetchSimilarityVotes(id)))).flat()
  await copyAll(resolveMergedSimilarityVotes(votes, productIds, mergedProduct.id), (vote) =>
    gateway.insertSimilarityVote(vote),
  )
}

export const mergeProducts = async (
  gateway: ProductMergeGateway,
  input: MergeProductsInput,
): Promise<Product> => {
  const { values, ownerId, productIds } = input
  const mergedProduct = await gateway.createProduct(
    {
      name: values.name,
      category: values.category,
      base: values.base,
      brand: values.brand,
      description: values.description,
      energy_joules: values.energyJoules,
      allergens: values.allergens,
      is_organic: values.isOrganic,
      barcode: values.barcode,
    },
    ownerId,
  )

  try {
    await fillMergedProduct(gateway, mergedProduct, input)
  } catch (error) {
    await gateway.deleteProduct(mergedProduct.id).catch(() => undefined)
    throw error
  }

  for (const productId of productIds) await gateway.deleteProduct(productId)
  return mergedProduct
}
