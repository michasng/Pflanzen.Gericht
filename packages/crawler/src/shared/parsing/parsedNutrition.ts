import type { KnownNutrientName } from '@pflanzen-gericht/contracts'

export interface ParsedNutrition {
  energyKilojoules: number | null
  nutrientsPer100g: Partial<Record<KnownNutrientName, number>>
}
