import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { SiteId } from '../../schema/crawledProduct.js'
import { getProductImagePath } from './outputPaths.js'

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}
const DEFAULT_EXTENSION = 'jpg'

const resolveImageExtension = (imageUrl: string, contentType: string | null): string => {
  if (contentType && EXTENSION_BY_CONTENT_TYPE[contentType])
    return EXTENSION_BY_CONTENT_TYPE[contentType]
  const urlExtension = path.extname(new URL(imageUrl).pathname).replace('.', '').toLowerCase()
  return urlExtension || DEFAULT_EXTENSION
}

export const downloadProductImage = async (
  site: SiteId,
  slug: string,
  imageUrl: string,
): Promise<string> => {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(
      `Failed to download image ${imageUrl}: ${response.status} ${response.statusText}`,
    )
  }
  const extension = resolveImageExtension(imageUrl, response.headers.get('content-type'))
  const filePath = getProductImagePath(site, slug, extension)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, Buffer.from(await response.arrayBuffer()))
  return filePath
}
