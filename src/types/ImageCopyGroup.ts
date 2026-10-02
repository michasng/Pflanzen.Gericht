import type { ProductImage } from '@/types'

export interface ImageCopyGroup {
  label: string
  images: Pick<ProductImage, 'id' | 'storagePath'>[]
}
