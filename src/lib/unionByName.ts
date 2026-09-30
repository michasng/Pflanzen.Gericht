const normalizeName = (name: string): string => name.trim().toLowerCase()

export const unionByName = <T extends { name: string }>(...lists: T[][]): T[] => {
  const seenNames = new Set<string>()
  return lists.flat().filter((item) => {
    const normalizedName = normalizeName(item.name)
    if (seenNames.has(normalizedName)) return false
    seenNames.add(normalizedName)
    return true
  })
}
