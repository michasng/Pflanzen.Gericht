type ComparableValue = string | number | boolean | null | readonly string[] | Record<string, number>

export const isEmptyComparableValue = (value: ComparableValue): boolean => {
  if (value === null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}
