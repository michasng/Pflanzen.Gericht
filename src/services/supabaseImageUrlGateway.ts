import { getImageUrl } from '@/services/catalog'
import type { ImageUrlGateway } from '@/services/ImageUrlGateway'

export const supabaseImageUrlGateway: ImageUrlGateway = {
  getImageUrl,
}
