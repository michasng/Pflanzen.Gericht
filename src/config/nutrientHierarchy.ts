export interface NutrientHierarchyEntry {
  name: string
  parentName?: string
}

// defines both the display order of known nutrients and which nutrients are
// already included in another, e.g. sugars are included in carbohydrates
export const NUTRIENT_HIERARCHY: readonly NutrientHierarchyEntry[] = [
  { name: 'Fett' },
  { name: 'Gesättigte Fettsäuren', parentName: 'Fett' },
  { name: 'Kohlenhydrate' },
  { name: 'Zucker', parentName: 'Kohlenhydrate' },
  { name: 'Zugesetzter Zucker', parentName: 'Zucker' },
  { name: 'Ballaststoffe' },
  { name: 'Eiweiß' },
  { name: 'Salz' },
]

export const NUTRIENT_ORDER_INDEX: ReadonlyMap<string, number> = new Map(
  NUTRIENT_HIERARCHY.map((entry, index) => [entry.name, index]),
)

export const NUTRIENT_PARENT_NAME: ReadonlyMap<string, string> = new Map(
  NUTRIENT_HIERARCHY.filter(
    (entry): entry is { name: string; parentName: string } => entry.parentName !== undefined,
  ).map((entry) => [entry.name, entry.parentName]),
)
