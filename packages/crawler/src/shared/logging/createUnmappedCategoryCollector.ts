import type { UnmappedCategory } from '../../schema/unmappedCategory.js'

export interface UnmappedCategoryRecorder {
  record(unmappedCategory: UnmappedCategory): void
}

export interface UnmappedCategoryCollector extends UnmappedCategoryRecorder {
  list(): readonly UnmappedCategory[]
}

export const createUnmappedCategoryCollector = (): UnmappedCategoryCollector => {
  const unmappedCategories: UnmappedCategory[] = []
  return {
    record: (unmappedCategory) => {
      unmappedCategories.push(unmappedCategory)
    },
    list: () => unmappedCategories,
  }
}
