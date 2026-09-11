import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { generateSquareImageVariants } from '../generateSquareImageVariants'
import { ImageSize, IMAGE_SIZE_PIXELS } from '@/config/imageSizes'

class SuccessfulImage {
  public onload: (() => void) | null = null
  public onerror: (() => void) | null = null
  public width = 200
  public height = 100

  public set src(_value: string) {
    this.onload?.()
  }
}

class FailingImage {
  public onload: (() => void) | null = null
  public onerror: (() => void) | null = null

  public set src(_value: string) {
    this.onerror?.()
  }
}

describe('generateSquareImageVariants', () => {
  const originalImage = globalThis.Image
  const originalCreateObjectUrl = URL.createObjectURL
  const originalRevokeObjectUrl = URL.revokeObjectURL
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  const originalToBlob = HTMLCanvasElement.prototype.toBlob

  const fillRect = vi.fn<(x: number, y: number, w: number, h: number) => void>()
  const drawImage =
    vi.fn<(image: CanvasImageSource, x: number, y: number, w: number, h: number) => void>()

  beforeEach(() => {
    vi.stubGlobal('Image', SuccessfulImage)
    URL.createObjectURL = () => 'blob:mock'
    URL.revokeObjectURL = () => undefined
    fillRect.mockClear()
    drawImage.mockClear()
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: () => ({ fillRect, drawImage, fillStyle: '' }),
    })
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      configurable: true,
      value: function (this: HTMLCanvasElement, callback: BlobCallback) {
        callback(new Blob(['variant'], { type: 'image/webp' }))
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    globalThis.Image = originalImage
    URL.createObjectURL = originalCreateObjectUrl
    URL.revokeObjectURL = originalRevokeObjectUrl
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: originalGetContext,
    })
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      configurable: true,
      value: originalToBlob,
    })
  })

  describe('given a valid image file', () => {
    it('generates a webp file for each configured image size', async () => {
      const variants = await generateSquareImageVariants(new File(['data'], 'product.jpg'))

      expect(Object.keys(variants).sort()).toEqual(Object.values(ImageSize).sort())
      for (const size of Object.values(ImageSize)) {
        expect(variants[size].name).toBe(`${size}.webp`)
        expect(variants[size].type).toBe('image/webp')
      }
    })

    it('draws a white background before drawing the scaled image on each canvas', async () => {
      await generateSquareImageVariants(new File(['data'], 'product.jpg'))

      expect(fillRect).toHaveBeenCalledTimes(Object.values(ImageSize).length)
      expect(drawImage).toHaveBeenCalledTimes(Object.values(ImageSize).length)
    })

    it('scales the image to fit within each target size while preserving aspect ratio', async () => {
      await generateSquareImageVariants(new File(['data'], 'product.jpg'))

      for (const size of Object.values(ImageSize)) {
        const sizePixels = IMAGE_SIZE_PIXELS[size]
        expect(drawImage).toHaveBeenCalledWith(
          expect.anything(),
          expect.any(Number),
          expect.any(Number),
          sizePixels,
          sizePixels / 2,
        )
      }
    })
  })

  describe('given an invalid image file', () => {
    it('rejects with an error', async () => {
      vi.stubGlobal('Image', FailingImage)

      await expect(generateSquareImageVariants(new File(['data'], 'broken.jpg'))).rejects.toThrow(
        'Bild ungültig.',
      )
    })
  })
})
