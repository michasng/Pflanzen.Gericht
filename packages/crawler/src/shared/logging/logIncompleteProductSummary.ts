import type { IncompleteProduct } from '../../schema/incompleteProduct.js'
import type { Logger } from './logger.js'

export const logIncompleteProductSummary = (
  logger: Logger,
  incompleteProducts: readonly IncompleteProduct[],
): void => {
  if (!incompleteProducts.length) return
  const lines = incompleteProducts.map(
    ({ name, sourceUrl, missingFieldNames }) =>
      `  - ${name || '(no name)'}: missing ${missingFieldNames.join(' and ')}\n    ${sourceUrl}`,
  )
  logger.warn(
    `${incompleteProducts.length} product(s) without required fields:\n${lines.join('\n')}`,
  )
}
