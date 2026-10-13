import type { CrawledProduct } from '../../schema/crawledProduct.js'
import type { NavigationContext, ProductScraper } from '../../sites/types.js'

export const crawlProductUrls = async function* <Context extends NavigationContext>(
  productScraper: ProductScraper<Context>,
  context: Context,
  productUrls: readonly string[],
): AsyncGenerator<CrawledProduct> {
  for (const productUrl of productUrls) {
    await context.navigateTo(productUrl)
    const product = await productScraper.scrapeProduct(context, productUrl)
    if (product) yield product
  }
}
