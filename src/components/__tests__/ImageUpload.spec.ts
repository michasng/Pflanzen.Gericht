import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ImageUpload from '../ImageUpload.vue'

class SuccessfulImage {
  public onload: (() => void) | null = null
  public onerror: (() => void) | null = null
  public width = 100
  public height = 100

  public set src(_value: string) {
    this.onload?.()
  }
}

describe('ImageUpload', () => {
  const originalImage = globalThis.Image
  const originalCreateObjectUrl = URL.createObjectURL
  const originalRevokeObjectUrl = URL.revokeObjectURL
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  const originalToBlob = HTMLCanvasElement.prototype.toBlob

  beforeEach(() => {
    vi.stubGlobal('Image', SuccessfulImage)
    URL.createObjectURL = () => 'blob:mock'
    URL.revokeObjectURL = () => undefined
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: () => ({
        drawImage: () => undefined,
      }),
    })
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      configurable: true,
      value: (callback: BlobCallback) => {
        callback(new Blob(['compressed'], { type: 'image/webp' }))
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

  it('given an injected file has no mime type but an image extension, queues the image', async () => {
    const wrapper = mount(ImageUpload)
    const addFile = Reflect.get(wrapper.vm, 'addFile')
    if (!(addFile instanceof Function)) {
      throw new Error('Expected ImageUpload to expose addFile.')
    }

    await addFile(new File(['data'], 'product-image.jpg'))

    const emittedEvents = wrapper.emitted('change')
    if (!emittedEvents?.[0]?.[0] || !Array.isArray(emittedEvents[0][0])) {
      throw new Error('Expected ImageUpload to emit queued files.')
    }

    const emittedFiles = emittedEvents[0][0]
    expect(emittedFiles).toHaveLength(1)
    expect(emittedFiles[0]).toBeInstanceOf(File)
    expect(emittedFiles[0]?.name).toBe('product-image.webp')
    expect(emittedFiles[0]?.type).toBe('image/webp')
    expect(wrapper.text()).not.toContain('Ein Bild konnte nicht verarbeitet werden.')
  })
})
