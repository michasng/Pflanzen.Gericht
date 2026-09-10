export const canonicalizeProductPair = (idA: string, idB: string): [string, string] =>
  idA <= idB ? [idA, idB] : [idB, idA]
