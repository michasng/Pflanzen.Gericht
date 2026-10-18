import type { InjectionKey } from 'vue'
import type { ImageSize } from '@/config/imageSizes'

export const imageUrlGatewayKey: InjectionKey<ImageUrlGateway> = Symbol('imageUrlGateway')

export interface ImageUrlGateway {
  getImageUrl: (bucket: string, storagePath: string, size: ImageSize) => string
}
