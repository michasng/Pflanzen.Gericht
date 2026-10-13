export const ALLERGENS = ['gluten', 'soy', 'nuts'] as const
export type Allergen = (typeof ALLERGENS)[number]
