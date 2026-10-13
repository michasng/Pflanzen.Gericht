import { BASES, type Base } from '@pflanzen-gericht/contracts'

export { BASES }
export type { Base }

const BASE_LABELS: Record<Base, string> = {
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
}
const isBase = (value: string): value is Base => (BASES as readonly string[]).includes(value)
export const baseToLabel = (base: string): string => (isBase(base) ? BASE_LABELS[base] : base)
