export interface MatchableProduct {
  name: string
  brand: string | null
}

const MIN_SIGNIFICANT_WORD_LENGTH = 4

export const normalizeBrandForMatch = (brand: string | null): string =>
  (brand ?? '').trim().toLowerCase()

export const getSignificantWordSet = (name: string): Set<string> =>
  new Set(
    name
      .split(/\s+/)
      .filter((word) => word.length >= MIN_SIGNIFICANT_WORD_LENGTH)
      .map((word) => word.toLowerCase()),
  )

const areSetsEqual = (a: Set<string>, b: Set<string>): boolean =>
  a.size === b.size && [...a].every((value) => b.has(value))

/**
 * Two products are the same product only if their brand matches exactly
 * (case-insensitive, both blank counts as equal) AND the set of
 * "significant" words (longer than 3 letters) in their names is identical.
 */
export const areProductsSameByFuzzyMatch = (a: MatchableProduct, b: MatchableProduct): boolean =>
  normalizeBrandForMatch(a.brand) === normalizeBrandForMatch(b.brand) &&
  areSetsEqual(getSignificantWordSet(a.name), getSignificantWordSet(b.name))
