import { DATABASE_LIST_VISIBILITY } from '@/config/databaseListVisibility'
import { ListVisibility } from '@/config/ListVisibility'
import type { Enums } from '@/types/database'

export const fromDatabaseListVisibility = (value: Enums<'list_visibility'>): ListVisibility => {
  const visibility = Object.values(ListVisibility).find(
    (candidate) => DATABASE_LIST_VISIBILITY[candidate] === value,
  )
  if (!visibility) throw new Error(`Unbekannte Sichtbarkeit: ${value}`)
  return visibility
}
