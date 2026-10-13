const CENTS_PER_EURO = 100

export const parseEuroCents = (euroText: string | null | undefined): number => {
  const euros = euroText ? Number.parseFloat(euroText) : Number.NaN
  return Number.isFinite(euros) ? Math.round(euros * CENTS_PER_EURO) : 0
}
