import { describe, expect, it } from 'vitest'
import { DATABASE_LIST_VISIBILITY } from '@/config/databaseListVisibility'
import { ListVisibility } from '@/config/ListVisibility'
import { fromDatabaseListVisibility } from '@/lib/fromDatabaseListVisibility'

describe('fromDatabaseListVisibility', () => {
  describe('given any visibility', () => {
    it.each(Object.values(ListVisibility))('reverses the database mapping of %s', (visibility) => {
      expect(fromDatabaseListVisibility(DATABASE_LIST_VISIBILITY[visibility])).toBe(visibility)
    })
  })
})
