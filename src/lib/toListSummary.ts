import { ImageBucket } from '@/config/imageBucket'
import { ListVisibility } from '@/config/ListVisibility'
import type { ListSummary } from '@/lib/ListSummary'
import type { CamelCasedKeys } from '@/lib/CamelCasedKeys'
import type { Tables } from '@/types/database'

type ListSummaryRow = CamelCasedKeys<Tables<'list_summary'>>

const VISIBILITY_BY_DATABASE_VALUE: Record<
  NonNullable<ListSummaryRow['visibility']>,
  ListVisibility
> = {
  public: ListVisibility.Public,
  private: ListVisibility.Private,
}

// Views mark every column nullable, although the underlying list columns never are.
export const toListSummary = (row: ListSummaryRow): ListSummary => {
  if (!row.id || !row.ownerId || !row.name || !row.visibility || row.productCount === null) {
    throw new Error('Die Liste konnte nicht gelesen werden.')
  }
  return {
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    visibility: VISIBILITY_BY_DATABASE_VALUE[row.visibility],
    productCount: row.productCount,
    coverImage: row.coverStoragePath
      ? { bucket: ImageBucket.Product, storagePath: row.coverStoragePath }
      : null,
  }
}
