import type { UnmappedCategory } from '../../schema/unmappedCategory.js'
import type { Logger } from './logger.js'

export const logUnmappedCategorySummary = (
  logger: Logger,
  unmappedCategories: readonly UnmappedCategory[],
): void => {
  if (!unmappedCategories.length) return
  const uniqueHints = [...new Set(unmappedCategories.map(({ hint, name }) => hint ?? name))].sort()
  logger.warn(
    `${unmappedCategories.length} product(s) without category, unmapped:\n${uniqueHints.map((hint) => `  - ${hint}`).join('\n')}`,
  )
}
