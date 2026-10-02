import type { SnakeCasedKeys } from '@/lib/SnakeCasedKeys'

const UPPERCASE_LETTER_PATTERN = /[A-Z]/g

const toSnakeCase = (key: string): string =>
  key.replace(UPPERCASE_LETTER_PATTERN, (character) => `_${character.toLowerCase()}`)

export const snakeifyKeys = <T>(value: T): SnakeCasedKeys<T> => {
  // The compiler cannot prove key remapping, so the results below are cast to the mapped type.
  if (Array.isArray(value)) return value.map(snakeifyKeys) as SnakeCasedKeys<T>
  if (value === null || typeof value !== 'object') return value as SnakeCasedKeys<T>
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [toSnakeCase(key), snakeifyKeys(entry)]),
  ) as SnakeCasedKeys<T>
}
