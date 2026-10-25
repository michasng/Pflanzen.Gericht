import { ImageBucket } from '@/config/imageBucket'
import { ListVisibility } from '@/config/ListVisibility'
import type { ListSummary } from '@/lib/ListSummary'

export const createListSummary = (overrides: Partial<ListSummary> = {}): ListSummary => ({
  id: 'list-1',
  ownerId: 'user-1',
  name: 'Favoriten',
  visibility: ListVisibility.Public,
  productCount: 2,
  coverImage: { bucket: ImageBucket.Product, storagePath: 'cover.jpg' },
  ...overrides,
})
