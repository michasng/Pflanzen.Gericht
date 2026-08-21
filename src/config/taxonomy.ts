export const CATEGORIES = [
  'meat_alternative',
  'cheese',
  'milk',
  'eggs',
  'cold_cuts',
  'sausage',
  'fish_alternative',
  'yogurt',
  'ice_cream',
  'spread',
  'snack',
  'sweets',
  'ready_meal',
  'original',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<Category, string> = {
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
}

export const BASES = [
  'soy',
  'pea',
  'oat',
  'wheat',
  'lupin',
  'chickpea',
  'almond',
  'cashew',
  'coconut',
  'rice',
  'hemp',
  'tofu',
  'seitan',
  'mycoprotein',
  'blend',
] as const

export type Base = (typeof BASES)[number]

export const BASE_LABELS: Record<Base, string> = {
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
}

export const TAGS = [
  'sustainable_packaging',
  'lots_of_plastic',
  'clean_ingredients',
  'low_sugar',
  'high_protein',
  'gluten_free',
  'soy_free',
  'organic',
  'no_palm_oil',
  'few_ingredients',
  'melts_well',
  'kid_friendly',
  'budget_friendly',
  'expensive',
  'easy_to_prepare',
  'very_similar',
  'meaty_flavor',
  'cheesy_flavor',
] as const

export type Tag = (typeof TAGS)[number]

export const TAG_LABELS: Record<Tag, string> = {
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
}

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

export const RATING_CRITERIA = ['taste', 'consistency', 'appearance', 'nutrition', 'value'] as const

export type RatingCriterion = (typeof RATING_CRITERIA)[number]

export const RATING_CRITERION_LABELS: Record<RatingCriterion, string> = {
  taste: 'Geschmack',
  consistency: 'Konsistenz',
  appearance: 'Aussehen',
  nutrition: 'Nährwerte',
  value: 'Preis-Leistung',
}
