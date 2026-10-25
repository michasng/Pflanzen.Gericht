import { ImageBucket } from '@/config/imageBucket'
import { fromDatabaseListVisibility } from '@/lib/fromDatabaseListVisibility'
import type { ListSummary } from '@/lib/ListSummary'
import type { CamelCasedKeys } from '@/lib/CamelCasedKeys'
import type { Tables } from '@/types/database'

type ListSummaryRow = CamelCasedKeys<Tables<'list_summary'>>

type CompleteListSummaryRow = ListSummaryRow & {
  id: string
  ownerId: string
  name: string
  visibility: NonNullable<ListSummaryRow['visibility']>
  productCount: number
}

const isCompleteRow = (row: ListSummaryRow): row is CompleteListSummaryRow =>
  !!row.id && !!row.ownerId && !!row.name && !!row.visibility && row.productCount !== null

export const toListSummary = (row: ListSummaryRow): ListSummary => {
  if (!isCompleteRow(row)) throw new Error('Die Liste konnte nicht gelesen werden.')
  return {
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    visibility: fromDatabaseListVisibility(row.visibility),
    productCount: row.productCount,
    coverImage: row.coverStoragePath
      ? { bucket: ImageBucket.Product, storagePath: row.coverStoragePath }
      : null,
  }
}
