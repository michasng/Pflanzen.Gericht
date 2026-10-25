import type { PageRequest } from '@/lib/PageRequest'

export const toPageRange = ({ page, pageSize }: PageRequest): [number, number] => [
  page * pageSize,
  (page + 1) * pageSize - 1,
]
