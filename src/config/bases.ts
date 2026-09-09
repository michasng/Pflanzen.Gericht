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
const isBase = (value: string): value is Base =>
  Object.prototype.hasOwnProperty.call(BASE_LABELS, value)
export const BASES = Object.keys(BASE_LABELS).filter(isBase)
export const baseToLabel = (base: string): string => (isBase(base) ? BASE_LABELS[base] : base)
