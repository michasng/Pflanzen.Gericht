export const CATEGORIES = [
  'meat',
  'sausage',
  'fish',
  'cheese',
  'milk',
  'yogurt',
  'cream',
  'eggs',
  'spread',
  'snack',
  'sweets',
  'ice_cream',
  'ready_meal',
  'other',
] as const
export type Category = (typeof CATEGORIES)[number]
