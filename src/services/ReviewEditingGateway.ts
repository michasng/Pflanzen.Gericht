import type { InjectionKey } from 'vue'
import type { Product, ProductImage, Review, ReviewImage } from '@/types'
import type { ReviewFields, ReviewWithDetails } from '@/services/reviews'

export const reviewEditingGatewayKey: InjectionKey<ReviewEditingGateway> =
  Symbol('reviewEditingGateway')

export interface ReviewEditingGateway {
  fetchProduct: (productId: string) => Promise<Product | null>
  fetchProductImages: (productId: string) => Promise<ProductImage[]>
  fetchReviewForEdit: (reviewId: string) => Promise<ReviewWithDetails | null>
  createReview: (
    productId: string,
    userId: string,
    fields: ReviewFields,
    tags: string[],
  ) => Promise<Review>
  updateReview: (reviewId: string, fields: ReviewFields, tags: string[]) => Promise<void>
  uploadReviewImage: (
    reviewId: string,
    userId: string,
    file: File,
    sortOrder: number,
  ) => Promise<ReviewImage>
  deleteReviewImage: (imageId: string, storagePath: string) => Promise<void>
  copyProductImageToReview: (
    productImage: ProductImage,
    reviewId: string,
    userId: string,
    sortOrder: number,
  ) => Promise<ReviewImage>
}
