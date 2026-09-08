import { NUTRIENT_PARENT_NAME } from '@/config/nutrientHierarchy'

// counts how many known nutrients this one is included in, e.g. added sugars
// are included in sugars, which are included in carbohydrates, so a depth of 2
export const getNutrientHierarchyDepth = (name: string): number => {
  const parentName = NUTRIENT_PARENT_NAME.get(name)
  if (parentName === undefined) return 0
  return 1 + getNutrientHierarchyDepth(parentName)
}
