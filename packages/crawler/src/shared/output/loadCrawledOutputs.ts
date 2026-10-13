import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { CrawledProduct, SiteId } from '../../schema/crawledProduct.js'
import { getSiteOutputDir } from './outputPaths.js'

const readSiteProducts = async (site: SiteId): Promise<CrawledProduct[]> => {
  const dir = getSiteOutputDir(site)
  const entries = await readdir(dir).catch(() => [])
  const jsonFiles = entries.filter((entry) => entry.endsWith('.json'))
  return Promise.all(
    jsonFiles.map(
      async (file) => JSON.parse(await readFile(path.join(dir, file), 'utf-8')) as CrawledProduct,
    ),
  )
}

/** Loads every crawler's JSON output, in site registry order. */
export const loadCrawledOutputs = async (siteIds: readonly SiteId[]): Promise<CrawledProduct[]> => {
  const productsBySite = await Promise.all(siteIds.map(readSiteProducts))
  return productsBySite.flat()
}
