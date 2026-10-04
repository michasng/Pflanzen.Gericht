import { EMPTY_COMPARED_VALUE } from '@/lib/formatComparedFieldValue'

export const formatComparedSourceUrls = (sourceUrls: string[]): string =>
  sourceUrls.length ? sourceUrls.join('\n') : EMPTY_COMPARED_VALUE
