export const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
