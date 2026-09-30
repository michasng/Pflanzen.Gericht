import type {
  PriceReport,
  Product,
  ProductImage,
  ProductInsert,
  ProductSimilarityVote,
  Review,
} from '@/types'
import type { ProductFormValues } from '@/types/productForm'

export type MergedProductFields = Pick<
  ProductInsert,
  | 'name'
  | 'category'
  | 'base'
  | 'brand'
  | 'description'
  | 'energy_joules'
  | 'allergens'
  | 'is_organic'
  | 'barcode'
>

export interface ProductMergeGateway {
  createProduct: (fields: MergedProductFields, ownerId: string) => Promise<Product>
  updateProduct: (productId: string, fields: MergedProductFields) => Promise<void>
  replaceIngredients: (
    productId: string,
    ingredients: ProductFormValues['ingredients'],
  ) => Promise<void>
  replaceNutrients: (productId: string, nutrients: ProductFormValues['nutrients']) => Promise<void>
  copyImage: (
    image: ProductImage,
    ownerId: string,
    productId: string,
    sortOrder: number,
  ) => Promise<void>
  fetchReviews: (productId: string) => Promise<Review[]>
  copyReview: (review: Review, productId: string) => Promise<void>
  fetchPriceReports: (productId: string) => Promise<PriceReport[]>
  copyPriceReport: (report: PriceReport, productId: string) => Promise<void>
  fetchSimilarityVotes: (productId: string) => Promise<ProductSimilarityVote[]>
  insertSimilarityVote: (vote: ProductSimilarityVote) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
}
