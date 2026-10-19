interface ReweNutrientInformation {
  nutrientType: { code: string }
  quantityContained: { value: number; uom: string }
}

export interface ReweNutritionFacts {
  servingSize: { value: number; uom: string }
  nutrientInformation: ReweNutrientInformation[]
}
