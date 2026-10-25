import type { ImageBucket } from '@/config/imageBucket'

export interface CoverImageSource {
  bucket: ImageBucket
  storagePath: string
}
