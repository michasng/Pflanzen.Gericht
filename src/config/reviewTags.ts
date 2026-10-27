export const TAG_GROUPS = [
  {
    label: 'Geschmack',
    tags: { sweet: 'Süß', salty: 'Salzig', bitter: 'Bitter', sour: 'Sauer', umami: 'Umami' },
  },
  {
    label: 'Charakter',
    tags: {
      intense: 'Intensiv',
      bland: 'Fad',
      spiced: 'Würzig',
      spicy: 'Scharf',
      smoky: 'Rauchig',
      hearty: 'Deftig',
      light: 'Leicht',
      greasy: 'Fettig',
    },
  },
  {
    label: 'Konsistenz',
    tags: {
      soft: 'Weich',
      firm: 'Fest',
      juicy: 'Saftig',
      dry: 'Trocken',
      fluffy: 'Fluffig',
      chewy: 'Zäh',
      creamy: 'Cremig',
      fibrous: 'Faserig',
      crispy: 'Knusprig',
      crumbly: 'Bröselig',
    },
  },
  {
    label: 'Ähnlichkeit',
    tags: {
      similar_to_animal_product: 'Ähnlich zu tierischem Produkt',
      similar_to_brand_product: 'Ähnlich zu Markenprodukt',
      similar_to_homemade: 'Ähnlich zu selbstgemacht',
    },
  },
  {
    label: 'Verpackung',
    tags: {
      sustainable_packaging: 'Nachhaltige Verpackung',
      lots_of_plastic: 'Viel Plastik',
      to_go: 'Zum Mitnehmen geeignet',
      deceptive_packaging: 'Mogelpackung',
    },
  },
  {
    label: 'Andere',
    tags: {
      guilty_pleasure: 'Guilty Pleasure',
      hidden_gem: 'Hidden Gem',
      impresses_omnivores: 'Überzeugt Fleischesser',
    },
  },
] as const

type KeysOfUnion<T> = T extends T ? keyof T : never
export type Tag = KeysOfUnion<(typeof TAG_GROUPS)[number]['tags']>
export const TAG_LABELS = Object.fromEntries(
  TAG_GROUPS.flatMap((g) => Object.entries(g.tags)),
) as Record<Tag, string>
export const TAGS = Object.keys(TAG_LABELS) as Tag[]
export const tagToLabel = (tag: string): string => TAG_LABELS[tag as Tag] ?? tag
