import type { KnownNutrientName } from '@pflanzen-gericht/contracts'
import type { ParsedNutrition } from '../../shared/parsing/parsedNutrition.js'
import type { ReweNutritionFacts } from './reweNutritionFacts.js'

const NUTRIENT_CODE_MAP: Readonly<Record<string, KnownNutrientName>> = {
  FAT: 'Fett',
  FASAT: 'Gesättigte Fettsäuren',
  CHOAVL: 'Kohlenhydrate',
  'SUGAR-': 'Zucker',
  FIBTG: 'Ballaststoffe',
  'PRO-': 'Eiweiß',
  SALTEQ: 'Salz',
}
const ENERGY_KILOJOULE_CODE = 'ENER-'
const ENERGY_KILOJOULE_UOM = 'KJO'
const REFERENCE_SERVING_SIZE = 100
// Drinks are labelled per 100 ml instead of per 100 g.
const REFERENCE_SERVING_UOMS: readonly string[] = ['GR', 'ML']

export const parseNutrientsPer100g = (nutritionFacts: ReweNutritionFacts[]): ParsedNutrition => {
  const per100g = nutritionFacts.find(
    (facts) =>
      facts.servingSize.value === REFERENCE_SERVING_SIZE &&
      REFERENCE_SERVING_UOMS.includes(facts.servingSize.uom),
  )
  const nutrientsPer100g: Partial<Record<KnownNutrientName, number>> = {}
  let energyKilojoules: number | null = null
  for (const info of per100g?.nutrientInformation ?? []) {
    if (
      info.nutrientType.code === ENERGY_KILOJOULE_CODE &&
      info.quantityContained.uom === ENERGY_KILOJOULE_UOM
    ) {
      energyKilojoules = info.quantityContained.value
      continue
    }
    const nutrientName = NUTRIENT_CODE_MAP[info.nutrientType.code]
    if (nutrientName) nutrientsPer100g[nutrientName] = info.quantityContained.value
  }
  return { energyKilojoules, nutrientsPer100g }
}
