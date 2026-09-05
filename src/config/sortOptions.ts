export const SORT_OPTION_LABELS = {
  newest: 'Neueste',
  top_rated: 'Beste Bewertung',
  most_rated: 'Meiste Bewertungen',
  price_asc: 'Günstigste',
  price_desc: 'Teuerste',
  few_ingredients: 'Wenige Zutaten',
  calories_asc: 'Wenige Kalorien',
  calories_desc: 'Viele Kalorien',
  fat_asc: 'Wenig Fett',
  saturated_fat_asc: 'Wenige gesättigte Fettsäuren',
  sugar_asc: 'Wenig Zucker',
  protein_desc: 'Viel Protein',
  fiber_desc: 'Viele Ballaststoffe',
} as const
export type SortOption = keyof typeof SORT_OPTION_LABELS
export const SORT_OPTIONS = Object.keys(SORT_OPTION_LABELS) as SortOption[]
