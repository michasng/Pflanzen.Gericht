import { describe, it, expect, vi } from 'vitest'
import { useImageUpload } from '../useImageUpload'

type FakeImage = { id: string; storage_path: string; sort_order: number }

const makeImage = (id: string, sortOrder = 0): FakeImage => ({
  id,
  storage_path: `path/${id}`,
  sort_order: sortOrder,
})

describe('useImageUpload', () => {
  it('removes the image from existingImages when staged for deletion', () => {
    const { existingImages, handleDeleteImage } = useImageUpload(
      vi.fn<() => Promise<void>>(),
      vi.fn<() => Promise<void>>(),
    )
    existingImages.value = [makeImage('a'), makeImage('b')]

    handleDeleteImage(makeImage('a'))

    expect(existingImages.value.map((image) => image.id)).toEqual(['b'])
  })

  it('calls deleteFn for each staged deletion on commit', async () => {
    const deleteFn = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const { existingImages, handleDeleteImage, commitImageChanges } = useImageUpload(
      vi.fn<() => Promise<void>>(),
      deleteFn,
    )
    const imageA = makeImage('a')
    const imageB = makeImage('b')
    existingImages.value = [imageA, imageB]

    handleDeleteImage(imageA)
    await commitImageChanges()

    expect(deleteFn).toHaveBeenCalledExactlyOnceWith(imageA)
  })

  it('calls uploadFn for each pending file with sort order after existing images', async () => {
    const uploadFn = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const { existingImages, pendingFiles, commitImageChanges } = useImageUpload(
      uploadFn,
      vi.fn<() => Promise<void>>(),
    )
    existingImages.value = [makeImage('a', 0), makeImage('b', 1)]
    const fileC = new File([], 'c.jpg')
    const fileD = new File([], 'd.jpg')
    pendingFiles.value = [fileC, fileD]

    await commitImageChanges()

    expect(uploadFn).toHaveBeenCalledWith(fileC, 2)
    expect(uploadFn).toHaveBeenCalledWith(fileD, 3)
  })

  it('accounts for deleted images when calculating upload sort order', async () => {
    const uploadFn = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const { existingImages, pendingFiles, handleDeleteImage, commitImageChanges } = useImageUpload(
      uploadFn,
      vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    )
    existingImages.value = [makeImage('a', 0), makeImage('b', 1), makeImage('c', 2)]
    handleDeleteImage(makeImage('b', 1))
    pendingFiles.value = [new File([], 'new.jpg')]

    await commitImageChanges()

    expect(uploadFn).toHaveBeenCalledWith(expect.any(File), 2)
  })
})
