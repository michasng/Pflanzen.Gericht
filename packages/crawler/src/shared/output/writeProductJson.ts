import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { CrawledProduct, SiteId } from '../../schema/crawledProduct.js'
import { getProductJsonPath } from './outputPaths.js'
import { resolveProductSlug } from './resolveProductSlug.js'

export const writeProductJson = async (site: SiteId, product: CrawledProduct): Promise<string> => {
  const slug = resolveProductSlug(product.name, product.sourceUrl)
  const filePath = getProductJsonPath(site, slug)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(product, null, 2), 'utf-8')
  return filePath
}
