export const CATEGORY_LABELS = {
  meat: 'Fleisch-Alternative',
  sausage: 'Wurst-Alternative',
  fish: 'Fisch-Alternative',
  cheese: 'Käse-Alternative',
  milk: 'Milch-Alternative',
  yogurt: 'Joghurt-Alternative',
  cream: 'Sahne-Alternative',
  eggs: 'Ei-Alternative',
  spread: 'Brotaufstrich',
  snack: 'Snack',
  sweets: 'Süßigkeit',
  ice_cream: 'Eis',
  ready_meal: 'Fertigprodukt',
  other: 'Sonstiges',
} as const
export type Category = keyof typeof CATEGORY_LABELS
export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]
export const categoryToLabel = (category: string): string =>
  CATEGORY_LABELS[category as Category] ?? category

export const BASE_LABELS = {
  soy: 'Soja',
  pea: 'Erbse',
  oat: 'Hafer',
  wheat: 'Weizen',
  lupin: 'Lupine',
  chickpea: 'Kichererbse',
  almond: 'Mandel',
  cashew: 'Cashew',
  coconut: 'Kokosnuss',
  rice: 'Reis',
  hemp: 'Hanf',
  mycoprotein: 'Mykoprotein',
  blend: 'Gemisch',
} as const
export type Base = keyof typeof BASE_LABELS
export const BASES = Object.keys(BASE_LABELS) as Base[]
export const baseToLabel = (base: string): string => BASE_LABELS[base as Base] ?? base

export const TAG_GROUPS = [
  {
    label: 'Nachhaltigkeit',
    tags: {
      organic: 'Bio',
      lots_of_plastic: 'Viel Plastik',
      sustainable_packaging: 'Nachhaltige Verpackung',
    },
  },
  {
    label: 'Geschmack',
    tags: { sweet: 'Süß', salty: 'Salzig', bitter: 'Bitter', sour: 'Sauer', umami: 'Umami' },
  },
  { label: 'Allergene', tags: { gluten: 'Mit Gluten', soy: 'Mit Soja', nuts: 'Mit Nüssen' } },
  { label: 'Sonstiges', tags: { similar_to_animal_product: 'Ähnlich zu tierischem Produkt' } },
] as const

export type Tag = keyof (typeof TAG_GROUPS)[number]['tags']
export const TAG_LABELS = Object.fromEntries(
  TAG_GROUPS.flatMap((g) => Object.entries(g.tags)),
) as Record<Tag, string>
export const TAGS = Object.keys(TAG_LABELS) as Tag[]
export const tagToLabel = (tag: string): string => TAG_LABELS[tag as Tag] ?? tag

export const RATING_CRITERION_LABELS = {
  taste: 'Geschmack',
  consistency: 'Konsistenz',
  appearance: 'Aussehen',
  nutrition: 'Nährwerte',
  value: 'Preis-Leistung',
} as const
export type RatingCriterion = keyof typeof RATING_CRITERION_LABELS
export const RATING_CRITERIA = Object.keys(RATING_CRITERION_LABELS) as RatingCriterion[]

export const STORE_SUGGESTIONS = [
  'REWE',
  'EDEKA',
  'Lidl',
  'Aldi Nord',
  'Aldi Süd',
  'dm',
  'Rossmann',
  'Kaufland',
  'Netto',
  'Penny',
  'Alnatura',
  'Bio Company',
  'tegut',
  'Globus',
  'Spar',
  'Online-Shop',
] as const
