import type { CamelCasedKeys } from '@/lib/CamelCasedKeys'

const UNDERSCORE_LETTER_PATTERN = /_([a-z0-9])/g

const toCamelCase = (key: string): string =>
  key.replace(UNDERSCORE_LETTER_PATTERN, (_match, character: string) => character.toUpperCase())

export const camelizeKeys = <T>(value: T): CamelCasedKeys<T> => {
  // The compiler cannot prove key remapping, so the results below are cast to the mapped type.
  if (Array.isArray(value)) return value.map(camelizeKeys) as CamelCasedKeys<T>
  if (value === null || typeof value !== 'object') return value as CamelCasedKeys<T>
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [toCamelCase(key), camelizeKeys(entry)]),
  ) as CamelCasedKeys<T>
}
