const PATH_SEGMENT_SEPARATOR = '-'

/** Product URLs are unique per site, so their trailing path segments make a collision-free file slug. */
export const extractSlugFromUrlPath = (sourceUrl: string, pathSegmentCount: number): string =>
  new URL(sourceUrl).pathname
    .split('/')
    .filter(Boolean)
    .slice(-pathSegmentCount)
    .join(PATH_SEGMENT_SEPARATOR)
