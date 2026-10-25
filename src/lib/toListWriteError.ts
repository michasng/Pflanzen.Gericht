import { ListNameClashError } from '@/lib/ListNameClashError'

const UNIQUE_VIOLATION_CODE = '23505'

export const toListWriteError = (error: unknown): unknown => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if (error.code === UNIQUE_VIOLATION_CODE) return new ListNameClashError()
  }
  return error
}
