const ratingFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export const formatRating = (value: number): string => ratingFormatter.format(value)
