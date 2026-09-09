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
