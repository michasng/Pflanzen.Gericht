import { buildPaginatedUrl } from './buildPaginatedUrl.js'
import { inheritSearchParams } from './inheritSearchParams.js'

export interface ListingPage {
  productUrls: readonly string[]
  /** listings reached via "Mehr Produkte anzeigen" links, which drop the filter query of their parent listing */
  loadMoreUrls: readonly string[]
  lastPageNumber: number
}

export interface CollectProductUrlsOptions {
  listingUrls: readonly string[]
  limit: number | null
  readListingPage: (listingUrl: string) => Promise<ListingPage>
}

const FIRST_PAGE_NUMBER = 1

export const collectProductUrlsFromListings = async ({
  listingUrls,
  limit,
  readListingPage,
}: CollectProductUrlsOptions): Promise<string[]> => {
  const productUrls = new Set<string>()
  const visitedListingUrls = new Set<string>()
  const pendingListingUrls = [...listingUrls]
  const isLimitReached = () => limit !== null && productUrls.size >= limit

  while (pendingListingUrls.length && !isLimitReached()) {
    const listingUrl = pendingListingUrls.shift()
    if (!listingUrl || visitedListingUrls.has(listingUrl)) continue
    visitedListingUrls.add(listingUrl)

    const firstPage = await readListingPage(listingUrl)
    const pages = [firstPage]
    for (
      let pageNumber = FIRST_PAGE_NUMBER + 1;
      pageNumber <= firstPage.lastPageNumber && !isLimitReached();
      pageNumber += 1
    ) {
      pages.push(await readListingPage(buildPaginatedUrl(listingUrl, pageNumber)))
    }

    for (const page of pages) {
      for (const productUrl of page.productUrls) productUrls.add(productUrl)
      pendingListingUrls.push(
        ...page.loadMoreUrls.map((loadMoreUrl) => inheritSearchParams(loadMoreUrl, listingUrl)),
      )
    }
  }

  const collected = [...productUrls]
  return limit === null ? collected : collected.slice(0, limit)
}
