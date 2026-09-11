import { ImageSize, IMAGE_SIZE_PIXELS } from '@/config/imageSizes'

const WEBP_QUALITY = 0.85

const loadImageElement = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Bild ungültig.'))
    }
    image.src = objectUrl
  })

const drawSquareVariant = (image: HTMLImageElement, sizePixels: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = sizePixels
    canvas.height = sizePixels
    const context = canvas.getContext('2d')
    if (!context) {
      reject(new Error('Canvas nicht unterstützt.'))
      return
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, sizePixels, sizePixels)

    const scale = Math.min(sizePixels / image.width, sizePixels / image.height)
    const drawWidth = image.width * scale
    const drawHeight = image.height * scale
    context.drawImage(
      image,
      (sizePixels - drawWidth) / 2,
      (sizePixels - drawHeight) / 2,
      drawWidth,
      drawHeight,
    )

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Skalierung fehlgeschlagen.'))
          return
        }
        resolve(blob)
      },
      'image/webp',
      WEBP_QUALITY,
    )
  })

/**
 * Generates square, white-background thumbnail/preview/large variants of the given image,
 * scaled to fit within each target size.
 */
export const generateSquareImageVariants = async (file: File): Promise<Record<ImageSize, File>> => {
  const image = await loadImageElement(file)
  const entries = await Promise.all(
    Object.values(ImageSize).map(async (size) => {
      const blob = await drawSquareVariant(image, IMAGE_SIZE_PIXELS[size])
      return [size, new File([blob], `${size}.webp`, { type: 'image/webp' })] as const
    }),
  )
  return Object.fromEntries(entries) as Record<ImageSize, File>
}
