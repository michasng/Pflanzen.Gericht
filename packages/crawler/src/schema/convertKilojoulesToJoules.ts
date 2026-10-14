import { JOULES_PER_KILOJOULE } from './units.js'

export const convertKilojoulesToJoules = (kilojoules: number | null): number | null =>
  kilojoules === null ? null : Math.round(kilojoules * JOULES_PER_KILOJOULE)
