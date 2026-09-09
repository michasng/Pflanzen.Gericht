export const TAG_GROUPS = [
  {
    label: 'Geschmack',
    tags: { sweet: 'Süß', salty: 'Salzig', bitter: 'Bitter', sour: 'Sauer', umami: 'Umami' },
  },
  {
    label: 'Nachhaltigkeit',
    tags: {
      lots_of_plastic: 'Viel Plastik',
      sustainable_packaging: 'Nachhaltige Verpackung',
    },
  },
  {
    label: 'Ähnlichkeit',
    tags: {
      similar_to_animal_product: 'Ähnlich zu tierischem Produkt',
      similar_to_brand_product: 'Ähnlich zu Markenprodukt',
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
