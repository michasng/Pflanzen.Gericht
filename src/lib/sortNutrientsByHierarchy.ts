import { NUTRIENT_ORDER_INDEX } from '@/config/nutrientHierarchy'
import type { NutrientLike } from '@/config/nutrients'

// known nutrients are ordered by their hierarchy, e.g. fat before saturated
// fat; unknown nutrients keep a consistent order by sorting alphabetically
// and are placed after the known ones
export const sortNutrientsByHierarchy = <T extends NutrientLike>(nutrients: T[]): T[] =>
  [...nutrients].sort((a, b) => {
    const indexA = NUTRIENT_ORDER_INDEX.get(a.name)
    const indexB = NUTRIENT_ORDER_INDEX.get(b.name)
    if (indexA !== undefined && indexB !== undefined) return indexA - indexB
    if (indexA !== undefined) return -1
    if (indexB !== undefined) return 1
    return a.name.localeCompare(b.name, 'de-DE')
  })
