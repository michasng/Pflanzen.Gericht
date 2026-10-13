import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { SiteId } from '../../schema/crawledProduct.js'

const CRAWLER_PACKAGE_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..')

export const getSiteOutputDir = (site: SiteId): string =>
  path.join(CRAWLER_PACKAGE_ROOT, 'output', site)

export const getProductJsonPath = (site: SiteId, slug: string): string =>
  path.join(getSiteOutputDir(site), `${slug}.json`)

export const getProductImagePath = (site: SiteId, slug: string, extension: string): string =>
  path.join(getSiteOutputDir(site), `${slug}.${extension}`)

/** Finds the sibling image file for a product's JSON output, whatever its extension. */
export const findProductImagePath = async (site: SiteId, slug: string): Promise<string | null> => {
  const entries = await readdir(getSiteOutputDir(site)).catch(() => [])
  const imageFile = entries.find(
    (entry) => entry.startsWith(`${slug}.`) && !entry.endsWith('.json'),
  )
  return imageFile ? path.join(getSiteOutputDir(site), imageFile) : null
}
