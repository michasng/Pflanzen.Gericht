import type { InjectionKey } from 'vue'
import type {
  Product,
  ProductImage,
  ProductIngredient,
  ProductNutrient,
  ProductSource,
  ReviewImage,
} from '@/types'
import type { ProductReviewImages } from '@/services/reviews'
import type { ProductFields } from '@/types/productForm'
import type { IngredientWrite, NutrientWrite } from '@/types/productWrites'
import type { ProductActivityCounts } from '@/services/fetchProductActivityCounts'
import type { MergeProductsInput } from '@/services/mergeProducts'
import type { PublicProfile } from '@/services/profile'

export const productEditingGatewayKey: InjectionKey<ProductEditingGateway> =
  Symbol('productEditingGateway')

export interface ProductEditingGateway {
  fetchProduct: (productId: string) => Promise<Product | null>
  fetchProductImages: (productId: string) => Promise<ProductImage[]>
  fetchProductIngredients: (productId: string) => Promise<ProductIngredient[]>
  fetchProductNutrients: (productId: string) => Promise<ProductNutrient[]>
  fetchProductSources: (productId: string) => Promise<ProductSource[]>
  fetchProductReviewImages: (productId: string) => Promise<ProductReviewImages[]>
  fetchProductActivityCounts: (productId: string) => Promise<ProductActivityCounts>
  fetchPublicProfile: (userId: string) => Promise<PublicProfile | null>
  mergeProducts: (input: MergeProductsInput) => Promise<Product>
  createProduct: (fields: ProductFields, ownerId: string) => Promise<Product>
  updateProduct: (productId: string, fields: ProductFields) => Promise<void>
  replaceProductIngredients: (productId: string, ingredients: IngredientWrite[]) => Promise<void>
  replaceProductNutrients: (productId: string, nutrients: NutrientWrite[]) => Promise<void>
  replaceProductSources: (productId: string, urls: string[]) => Promise<void>
  uploadProductImage: (
    productId: string,
    userId: string,
    file: File,
    sortOrder: number,
  ) => Promise<ProductImage>
  deleteProductImage: (imageId: string, storagePath: string) => Promise<void>
  copyReviewImageToProduct: (
    reviewImage: ReviewImage,
    productId: string,
    userId: string,
    sortOrder: number,
  ) => Promise<ProductImage>
}
