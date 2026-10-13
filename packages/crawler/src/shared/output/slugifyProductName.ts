const DIACRITIC_REPLACEMENTS: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
}

const replaceDiacritics = (value: string): string =>
  value.replace(/[äöüß]/g, (character) => DIACRITIC_REPLACEMENTS[character] ?? character)

export const slugifyProductName = (name: string): string =>
  replaceDiacritics(name.toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
