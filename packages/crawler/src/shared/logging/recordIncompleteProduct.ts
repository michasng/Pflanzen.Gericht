import type { Logger } from './logger.js'
import type { IncompleteProduct } from '../../schema/incompleteProduct.js'
import type { IncompleteProductRecorder } from './createIncompleteProductCollector.js'

export const recordIncompleteProduct = (
  logger: Logger,
  recorder: IncompleteProductRecorder,
  incompleteProduct: IncompleteProduct,
): void => {
  if (!incompleteProduct.missingFieldNames.length) return
  logger.error(
    `Could not parse ${incompleteProduct.missingFieldNames.join(' and ')} for "${incompleteProduct.name}" (${incompleteProduct.sourceUrl})`,
  )
  recorder.record(incompleteProduct)
}
