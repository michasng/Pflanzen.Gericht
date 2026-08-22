const UMLAUT_MAP: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
}

export const slugifyUsername = (input: string): string =>
  input
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => UMLAUT_MAP[c] ?? c)
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30)
