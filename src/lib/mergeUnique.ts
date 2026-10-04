export const mergeUnique = <T>(first: T[], second: T[]): T[] => [...new Set([...first, ...second])]
