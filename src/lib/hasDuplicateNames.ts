const normalizeName = (name: string): string => name.trim().toLowerCase()

export const hasDuplicateNames = (names: string[]): boolean => {
  const normalizedNames = names.map(normalizeName).filter((name) => name.length > 0)
  return new Set(normalizedNames).size !== normalizedNames.length
}
