export const BASE_LABELS = {
  soy: 'Soja',
  pea: 'Erbse',
  oat: 'Hafer',
  wheat: 'Weizen',
  lupin: 'Lupine',
  chickpea: 'Kichererbse',
  almond: 'Mandel',
  cashew: 'Cashew',
  coconut: 'Kokosnuss',
  rice: 'Reis',
  hemp: 'Hanf',
  mycoprotein: 'Mykoprotein',
  blend: 'Gemisch',
} as const
export type Base = keyof typeof BASE_LABELS
export const BASES = Object.keys(BASE_LABELS) as Base[]
export const baseToLabel = (base: string): string => BASE_LABELS[base as Base] ?? base
