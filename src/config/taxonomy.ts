export const CATEGORY_LABELS = {
  meat_alternative: 'Fleisch-Ersatz',
  cheese: 'Käse',
  milk: 'Milch & Sahne',
  eggs: 'Eier',
  cold_cuts: 'Aufschnitt',
  sausage: 'Wurst',
  fish_alternative: 'Fisch-Ersatz',
  yogurt: 'Joghurt',
  ice_cream: 'Eis & Dessert',
  spread: 'Brotaufstrich',
  snack: 'Snack',
  sweets: 'Süßwaren',
  ready_meal: 'Fertigprodukt',
  original: 'Originell',
} as const

export type Category = keyof typeof CATEGORY_LABELS
export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]

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
  tofu: 'Tofu',
  seitan: 'Seitan',
  mycoprotein: 'Mykoprotein',
  blend: 'Gemisch',
} as const

export type Base = keyof typeof BASE_LABELS
export const BASES = Object.keys(BASE_LABELS) as Base[]

export const TAG_LABELS = {
  sustainable_packaging: 'Nachhaltige Verpackung',
  lots_of_plastic: 'Viel Plastik',
  clean_ingredients: 'Gute Zutaten',
  low_sugar: 'Wenig Zucker',
  high_protein: 'Hoher Proteingehalt',
  gluten_free: 'Glutenfrei',
  soy_free: 'Sojafrei',
  organic: 'Bio',
  no_palm_oil: 'Ohne Palmöl',
  few_ingredients: 'Wenig Zutaten',
  melts_well: 'Guter Schmelz',
  kid_friendly: 'Kindgeeignet',
  budget_friendly: 'Günstig',
  expensive: 'Teuer',
  easy_to_prepare: 'Leicht zuzubereiten',
  very_similar: 'Sehr ähnlich zum Original',
  meaty_flavor: 'Fleischiger Geschmack',
  cheesy_flavor: 'Käsiger Geschmack',
} as const

export type Tag = keyof typeof TAG_LABELS
export const TAGS = Object.keys(TAG_LABELS) as Tag[]

export const LOCATION_SUGGESTIONS = [
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

export const RATING_CRITERION_LABELS = {
  taste: 'Geschmack',
  consistency: 'Konsistenz',
  appearance: 'Aussehen',
  nutrition: 'Nährwerte',
  value: 'Preis-Leistung',
} as const

export type RatingCriterion = keyof typeof RATING_CRITERION_LABELS
export const RATING_CRITERIA = Object.keys(RATING_CRITERION_LABELS) as RatingCriterion[]
