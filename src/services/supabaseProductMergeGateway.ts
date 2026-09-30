import { supabase } from '@/lib/supabase'
import { copyImageVariants } from '@/lib/copyImageVariants'
import {
  createProduct,
  deleteProduct,
  replaceProductIngredients,
  replaceProductNutrients,
} from '@/services/products'
import type { ProductMergeGateway } from '@/services/ProductMergeGateway'

const PRODUCT_IMAGE_BUCKET = 'product-images'
const REVIEW_IMAGE_BUCKET = 'review-images'

const copyStoredImage = (
  bucketName: string,
  sourceStoragePath: string,
  destinationStoragePath: string,
): Promise<void> => {
  const bucket = supabase.storage.from(bucketName)
  return copyImageVariants(
    {
      copyVariant: async (sourcePath, destinationPath) => {
        const { error } = await bucket.copy(sourcePath, destinationPath)
        return { error }
      },
      removeVariants: async (paths) => {
        const { error } = await bucket.remove(paths)
        if (error) throw error
      },
    },
    sourceStoragePath,
    destinationStoragePath,
  )
}

const copyReviewDetails = async (
  reviewId: string,
  userId: string,
  copiedReviewId: string,
): Promise<void> => {
  const { data: tags, error: tagsError } = await supabase
    .from('review_tag')
    .select('tag')
    .eq('review_id', reviewId)
  if (tagsError) throw tagsError
  if (tags?.length) {
    const { error } = await supabase
      .from('review_tag')
      .insert(tags.map(({ tag }) => ({ review_id: copiedReviewId, tag })))
    if (error) throw error
  }

  const { data: images, error: imagesError } = await supabase
    .from('review_image')
    .select('storage_path, sort_order')
    .eq('review_id', reviewId)
  if (imagesError) throw imagesError
  for (const image of images ?? []) {
    const storagePath = `${userId}/${copiedReviewId}/${crypto.randomUUID()}`
    await copyStoredImage(REVIEW_IMAGE_BUCKET, image.storage_path, storagePath)
    const { error } = await supabase.from('review_image').insert({
      review_id: copiedReviewId,
      storage_path: storagePath,
      sort_order: image.sort_order,
    })
    if (error) throw error
  }
}

export const supabaseProductMergeGateway: ProductMergeGateway = {
  createProduct,
  deleteProduct,
  replaceIngredients: (productId, ingredients) =>
    replaceProductIngredients(
      productId,
      ingredients.map((ingredient) => ({
        name: ingredient.name,
        fraction_basis_points: ingredient.fractionBasisPoints,
        comparator: ingredient.comparator,
      })),
    ),
  replaceNutrients: (productId, nutrients) =>
    replaceProductNutrients(
      productId,
      nutrients.map((nutrient) => ({
        name: nutrient.name,
        amount_micrograms: nutrient.amountMicrograms,
      })),
    ),
  copyImage: async (image, ownerId, productId, sortOrder) => {
    const storagePath = `${ownerId}/${productId}/${crypto.randomUUID()}`
    await copyStoredImage(PRODUCT_IMAGE_BUCKET, image.storage_path, storagePath)
    const { error } = await supabase
      .from('product_image')
      .insert({ product_id: productId, storage_path: storagePath, sort_order: sortOrder })
    if (error) throw error
  },
  fetchReviews: async (productId) => {
    const { data, error } = await supabase.from('review').select('*').eq('product_id', productId)
    if (error) throw error
    return data ?? []
  },
  copyReview: async (review, productId) => {
    const { id, product_id: _originalProductId, ...fields } = review
    const { data, error } = await supabase
      .from('review')
      .insert({ ...fields, product_id: productId })
      .select('id')
      .single()
    if (error) throw error
    await copyReviewDetails(id, review.user_id, data.id)
  },
  fetchPriceReports: async (productId) => {
    const { data, error } = await supabase
      .from('price_report')
      .select('*')
      .eq('product_id', productId)
    if (error) throw error
    return data ?? []
  },
  copyPriceReport: async (report, productId) => {
    const {
      id: _id,
      product_id: _originalProductId,
      effective_price_euro_cents: _effectivePrice,
      ...fields
    } = report
    const { error } = await supabase
      .from('price_report')
      .insert({ ...fields, product_id: productId })
    if (error) throw error
  },
  fetchSimilarityVotes: async (productId) => {
    const { data, error } = await supabase
      .from('product_similarity_vote')
      .select('*')
      .or(`product_id_a.eq.${productId},product_id_b.eq.${productId}`)
    if (error) throw error
    return data ?? []
  },
  insertSimilarityVote: async (vote) => {
    const { id: _id, ...fields } = vote
    const { error } = await supabase.from('product_similarity_vote').insert(fields)
    if (error) throw error
  },
}
