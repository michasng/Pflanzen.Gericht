import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../../src/types/database.js'

// Mirrors src/config/imageSizes.ts and src/lib/generateSquareImageVariants.ts,
// reimplemented with sharp since Node has no Canvas/File APIs.
const IMAGE_SIZE_PIXELS = { thumbnail: 160, preview: 480, large: 960 } as const
type ImageSizeName = keyof typeof IMAGE_SIZE_PIXELS
const WEBP_QUALITY = 85

export const buildImageVariantPaths = (storagePath: string): string[] =>
  Object.keys(IMAGE_SIZE_PIXELS).map((size) => `${storagePath}/${size}.webp`)

const generateSquareVariant = (imagePath: string, sizePixels: number): Promise<Buffer> =>
  sharp(imagePath)
    .resize(sizePixels, sizePixels, { fit: 'contain', background: '#ffffff' })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()

/** Uploads a locally crawled product image as the standard 3 WebP variants + a product_image row. */
export const uploadProductImageFromFile = async (
  supabase: SupabaseClient<Database>,
  productId: string,
  userId: string,
  imagePath: string,
  sortOrder: number,
): Promise<void> => {
  const storagePath = `${userId}/${productId}/${randomUUID()}`
  const bucket = supabase.storage.from('product-images')
  const sizeNames = Object.keys(IMAGE_SIZE_PIXELS) as ImageSizeName[]

  const uploadedPaths: string[] = []
  try {
    for (const size of sizeNames) {
      const buffer = await generateSquareVariant(imagePath, IMAGE_SIZE_PIXELS[size])
      const variantPath = `${storagePath}/${size}.webp`
      const { error } = await bucket.upload(variantPath, buffer, { contentType: 'image/webp' })
      if (error) throw error
      uploadedPaths.push(variantPath)
    }
    const { error } = await supabase
      .from('product_image')
      .insert({ product_id: productId, storage_path: storagePath, sort_order: sortOrder })
    if (error) throw error
  } catch (error) {
    if (uploadedPaths.length) await bucket.remove(uploadedPaths)
    throw error
  }
}
