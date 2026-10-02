const SINGULAR_COUNT = 1

export const formatCountWithNoun = (count: number, singular: string, plural: string): string =>
  `${count} ${count === SINGULAR_COUNT ? singular : plural}`
