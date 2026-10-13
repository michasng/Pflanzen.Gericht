import { CATEGORIES, type Category } from '@pflanzen-gericht/contracts'

export { CATEGORIES }
export type { Category }

const CATEGORY_LABELS: Record<Category, string> = {
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
}
const isCategory = (value: string): value is Category =>
  (CATEGORIES as readonly string[]).includes(value)
export const categoryToLabel = (category: string): string =>
  isCategory(category) ? CATEGORY_LABELS[category] : category
