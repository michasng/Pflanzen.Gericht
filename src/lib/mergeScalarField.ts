type ScalarFieldValue = string | number | boolean | null

const hasClaim = (value: ScalarFieldValue): boolean =>
  value !== null && value !== '' && value !== false

export const mergeScalarField = <T extends ScalarFieldValue>(a: T, b: T): T | undefined => {
  if (a === b) return a
  if (!hasClaim(b)) return a
  if (!hasClaim(a)) return b
  return undefined
}
