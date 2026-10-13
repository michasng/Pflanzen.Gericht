import { ALLERGENS, type Allergen } from '@pflanzen-gericht/contracts'

export { ALLERGENS }
export type { Allergen }

const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: 'Gluten',
  soy: 'Soja',
  nuts: 'Nüsse',
}
const isAllergen = (value: string): value is Allergen =>
  (ALLERGENS as readonly string[]).includes(value)
export const allergenToLabel = (allergen: string): string =>
  isAllergen(allergen) ? ALLERGEN_LABELS[allergen] : allergen
