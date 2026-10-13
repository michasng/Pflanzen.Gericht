const PAGE_QUERY_PARAMETER = 'page'

export const buildPaginatedUrl = (listingUrl: string, pageNumber: number): string => {
  const url = new URL(listingUrl)
  url.searchParams.set(PAGE_QUERY_PARAMETER, String(pageNumber))
  return url.toString()
}
