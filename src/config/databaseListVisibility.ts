import { ListVisibility } from '@/config/ListVisibility'
import type { Enums } from '@/types/database'

export const DATABASE_LIST_VISIBILITY: Record<ListVisibility, Enums<'list_visibility'>> = {
  [ListVisibility.Public]: 'public',
  [ListVisibility.Private]: 'private',
}
