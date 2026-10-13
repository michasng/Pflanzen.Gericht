export const BASES = [
  'soy',
  'pea',
  'oat',
  'wheat',
  'lupin',
  'chickpea',
  'almond',
  'cashew',
  'coconut',
  'rice',
  'hemp',
  'mycoprotein',
  'blend',
] as const
export type Base = (typeof BASES)[number]
