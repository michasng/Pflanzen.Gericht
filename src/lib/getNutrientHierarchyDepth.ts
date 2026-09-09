import { NUTRIENT_PARENT_NAME } from '@/config/nutrientHierarchy'

// counts how many known nutrients this one is included in, e.g. added sugars
// are included in sugars, which are included in carbohydrates, so a depth of 2
export const getNutrientHierarchyDepth = (name: string): number => {
  const visitedNames = new Set([name])
  let currentName = name
  let depth = 0

  while (true) {
    const parentName = NUTRIENT_PARENT_NAME.get(currentName)
    if (parentName === undefined || visitedNames.has(parentName)) return depth

    visitedNames.add(parentName)
    currentName = parentName
    depth += 1
  }
}
