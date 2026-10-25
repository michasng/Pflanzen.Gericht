import type { ListVisibility } from '@/config/ListVisibility'
import type { CoverImageSource } from '@/lib/CoverImageSource'

export interface ListSummary {
  id: string
  ownerId: string
  name: string
  visibility: ListVisibility
  productCount: number
  coverImage: CoverImageSource | null
}
