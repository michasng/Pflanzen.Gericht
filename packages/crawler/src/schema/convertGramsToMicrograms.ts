import { MICROGRAMS_PER_GRAM } from './units.js'

export const convertGramsToMicrograms = (grams: number): number =>
  Math.round(grams * MICROGRAMS_PER_GRAM)
