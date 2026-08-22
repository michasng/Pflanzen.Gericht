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

export const TAG_LABELS = {
  // sustainability
  organic: 'Bio',
  lots_of_plastic: 'Viel Plastik',
  sustainable_packaging: 'Nachhaltige Verpackung',
  palm_oil: 'Mit Palmöl',
  // taste
  sweet: 'Süß',
  salty: 'Salzig',
  bitter: 'Bitter',
  sour: 'Sauer',
  umami: 'Umami',
  // nutrition
  many_ingredients: 'Viele Zutaten',
  few_ingredients: 'Wenige Zutaten',
  high_sugar: 'Viel Zucker',
  low_sugar: 'Wenig Zucker',
  high_fat: 'Viel Fett',
  low_fat: 'Wenig Fett',
  high_protein: 'Viel Protein',
  // allergens
  gluten: 'Mit Gluten',
  soy: 'Mit Soja',
  nuts: 'Mit Nüssen',
  // other
  similar_to_animal_product: 'Ähnlich zu tierischem Produkt',
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
