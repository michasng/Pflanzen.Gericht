export const KNOWN_NUTRIENT_NAMES = [
  'Fett',
  'Gesättigte Fettsäuren',
  'Kohlenhydrate',
  'Zucker',
  'Zugesetzter Zucker',
  'Ballaststoffe',
  'Eiweiß',
  'Salz',
] as const
export type KnownNutrientName = (typeof KNOWN_NUTRIENT_NAMES)[number]
