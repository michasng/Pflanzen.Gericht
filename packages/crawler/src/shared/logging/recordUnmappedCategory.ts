import type { Logger } from './logger.js'
import type { UnmappedCategory } from '../../schema/unmappedCategory.js'
import type { UnmappedCategoryRecorder } from './createUnmappedCategoryCollector.js'

export const recordUnmappedCategory = (
  logger: Logger,
  recorder: UnmappedCategoryRecorder,
  unmappedCategory: UnmappedCategory,
): void => {
  const hintSuffix = unmappedCategory.hint ? `: ${unmappedCategory.hint}` : ''
  logger.error(
    `Could not map category for "${unmappedCategory.name}" (${unmappedCategory.sourceUrl})${hintSuffix}`,
  )
  recorder.record(unmappedCategory)
}
