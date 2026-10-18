import type { Product, ProductImage } from '@/types'
import type { ProductActivityCounts } from '@/services/fetchProductActivityCounts'
import type { ProductFormValues } from '@/types/productForm'

export interface MergeSource extends ProductActivityCounts {
  product: Product
  images: ProductImage[]
  values: ProductFormValues
  ownerName: string
}
