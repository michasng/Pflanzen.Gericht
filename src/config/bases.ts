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
  lentil: 'Linse',
  fava: 'Ackerbohne',
  mung: 'Mungbohne',
  almond: 'Mandel',
  cashew: 'Cashew',
  peanut: 'Erdnuss',
  hazelnut: 'Haselnuss',
  pistachio: 'Pistazie',
  walnut: 'Walnuss',
  coconut: 'Kokosnuss',
  rice: 'Reis',
  hemp: 'Hanf',
  sunflower: 'Sonnenblume',
  sesame: 'Sesam',
  mycoprotein: 'Mykoprotein',
  jackfruit: 'Jackfrucht',
  sugar: 'Zucker',
  blend: 'Gemisch',
}
const isBase = (value: string): value is Base => (BASES as readonly string[]).includes(value)
export const baseToLabel = (base: string): string => (isBase(base) ? BASE_LABELS[base] : base)
