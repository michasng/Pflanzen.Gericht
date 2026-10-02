import { resolveMergedPriceReports } from '@/lib/resolveMergedPriceReports'
import { resolveMergedReviews } from '@/lib/resolveMergedReviews'
import { resolveMergedSimilarityVotes } from '@/lib/resolveMergedSimilarityVotes'
import { toReviewFields } from '@/lib/toReviewFields'
import type { MergedProductFields, ProductMergeGateway } from '@/services/ProductMergeGateway'
import type { Product, ProductImage } from '@/types'
import type { ProductFormValues } from '@/types/productForm'

export interface MergeProductsInput {
  productIds: [string, string]
  values: ProductFormValues
  acceptedImages: ProductImage[]
  ownerId: string
}

const TEMPORARY_NAME_PREFIX = 'Merge '

const fillMergedProduct = async (
  gateway: ProductMergeGateway,
  mergedProduct: Product,
  { productIds, values, acceptedImages, ownerId }: MergeProductsInput,
): Promise<void> => {
  await gateway.replaceIngredients(mergedProduct.id, values.ingredients)
  await gateway.replaceNutrients(mergedProduct.id, values.nutrients)
  for (const [sortOrder, image] of acceptedImages.entries()) {
    await gateway.copyImage(image, mergedProduct.id, ownerId, sortOrder)
  }

  const reviews = (await Promise.all(productIds.map((id) => gateway.fetchReviews(id)))).flat()
  for (const review of resolveMergedReviews(reviews)) {
    const copiedReview = await gateway.createReview(
      mergedProduct.id,
      review.userId,
      toReviewFields(review),
      review.tags,
      {
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    )
    for (const image of review.images) {
      await gateway.copyReviewImage(image, copiedReview.id, review.userId)
    }
  }

  const priceReports = (
    await Promise.all(productIds.map((id) => gateway.fetchPriceReports(id)))
  ).flat()
  for (const report of resolveMergedPriceReports(priceReports)) {
    await gateway.upsertPriceReport(
      mergedProduct.id,
      report.userId,
      report.store,
      report.cityName,
      report.priceEuroCents,
      report.salePriceEuroCents,
      report.observedAt,
      report.createdAt,
    )
  }

  const votes = (await Promise.all(productIds.map((id) => gateway.fetchSimilarityVotes(id)))).flat()
  for (const vote of resolveMergedSimilarityVotes(votes, productIds, mergedProduct.id)) {
    await gateway.voteSimilarity(vote.productIdA, vote.productIdB, vote.agreed, vote.userId, {
      createdAt: vote.createdAt,
      updatedAt: vote.updatedAt,
    })
  }
}

export const mergeProducts = async (
  gateway: ProductMergeGateway,
  input: MergeProductsInput,
): Promise<Product> => {
  const { values, ownerId, productIds } = input
  const mergedFields: MergedProductFields = {
    name: values.name,
    category: values.category,
    base: values.base,
    brand: values.brand,
    description: values.description,
    energyJoules: values.energyJoules,
    allergens: values.allergens,
    isOrganic: values.isOrganic,
    barcode: values.barcode,
  }
  const mergedProduct = await gateway.createProduct(
    { ...mergedFields, name: `${TEMPORARY_NAME_PREFIX}${productIds.join('-')}`, brand: null },
    ownerId,
  )

  try {
    await fillMergedProduct(gateway, mergedProduct, input)
  } catch (error) {
    await gateway.deleteProduct(mergedProduct.id).catch(() => undefined)
    throw error
  }

  for (const productId of productIds) await gateway.deleteProduct(productId)
  await gateway.updateProduct(mergedProduct.id, mergedFields)
  return { ...mergedProduct, ...mergedFields }
}
