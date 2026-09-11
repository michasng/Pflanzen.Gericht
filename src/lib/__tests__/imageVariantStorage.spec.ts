import { describe, expect, it, vi } from 'vitest'
import { ImageSize } from '@/config/imageSizes'
import {
  deleteImageVariants,
  getImageVariantPaths,
  persistImageVariants,
} from '../imageVariantStorage'

const createVariants = (): Record<ImageSize, File> => ({
  [ImageSize.Thumbnail]: new File(['thumbnail'], 'thumbnail.webp', { type: 'image/webp' }),
  [ImageSize.Preview]: new File(['preview'], 'preview.webp', { type: 'image/webp' }),
  [ImageSize.Large]: new File(['large'], 'large.webp', { type: 'image/webp' }),
})

describe('imageVariantStorage', () => {
  describe('given a storage path', () => {
    it('when getting variant paths, returns every configured image path', () => {
      expect(getImageVariantPaths('user/entity/file')).toEqual([
        'user/entity/file/thumbnail.webp',
        'user/entity/file/preview.webp',
        'user/entity/file/large.webp',
      ])
    })
  })

  describe('given an upload fails after an earlier variant succeeds', () => {
    it('when persisting variants, removes the uploaded variants and rethrows', async () => {
      const uploadError = new Error('upload failed')
      const removeVariants = vi
        .fn<(paths: string[]) => Promise<void>>()
        .mockResolvedValue(undefined)
      const uploadVariant = vi
        .fn<(path: string, file: File) => Promise<{ error: Error | null }>>()
        .mockImplementation(async (path) => ({
          error: path.endsWith('preview.webp') ? uploadError : null,
        }))

      await expect(
        persistImageVariants(
          { removeVariants, uploadVariant },
          'user/entity/file',
          createVariants(),
          async () => 'stored',
        ),
      ).rejects.toThrow(uploadError)

      expect(removeVariants).toHaveBeenCalledWith(['user/entity/file/thumbnail.webp'])
    })

    it('when cleanup also fails, preserves the original upload error', async () => {
      const uploadError = new Error('upload failed')
      const removeVariants = vi
        .fn<(paths: string[]) => Promise<void>>()
        .mockRejectedValue(new Error('cleanup failed'))
      const uploadVariant = vi
        .fn<(path: string, file: File) => Promise<{ error: Error | null }>>()
        .mockImplementation(async (path) => ({
          error: path.endsWith('preview.webp') ? uploadError : null,
        }))

      await expect(
        persistImageVariants(
          { removeVariants, uploadVariant },
          'user/entity/file',
          createVariants(),
          async () => 'stored',
        ),
      ).rejects.toThrow(uploadError)
    })
  })

  describe('given the record insert fails after all variants upload', () => {
    it('when persisting variants, removes every uploaded variant and rethrows', async () => {
      const insertError = new Error('insert failed')
      const removeVariants = vi
        .fn<(paths: string[]) => Promise<void>>()
        .mockResolvedValue(undefined)
      const uploadVariant = vi
        .fn<(path: string, file: File) => Promise<{ error: Error | null }>>()
        .mockResolvedValue({ error: null })

      await expect(
        persistImageVariants(
          { removeVariants, uploadVariant },
          'user/entity/file',
          createVariants(),
          async () => {
            throw insertError
          },
        ),
      ).rejects.toThrow(insertError)

      expect(removeVariants).toHaveBeenCalledWith(getImageVariantPaths('user/entity/file'))
    })
  })

  describe('given all uploads and persistence succeed', () => {
    it('when persisting variants, returns the stored value without cleanup', async () => {
      const removeVariants = vi
        .fn<(paths: string[]) => Promise<void>>()
        .mockResolvedValue(undefined)
      const uploadVariant = vi
        .fn<(path: string, file: File) => Promise<{ error: Error | null }>>()
        .mockResolvedValue({ error: null })

      const result = await persistImageVariants(
        { removeVariants, uploadVariant },
        'user/entity/file',
        createVariants(),
        async () => 'stored',
      )

      expect(result).toBe('stored')
      expect(removeVariants).not.toHaveBeenCalled()
    })
  })

  describe('given stored image directories', () => {
    it('when deleting variants, expands each directory to all image sizes', async () => {
      const removeVariants = vi
        .fn<(paths: string[]) => Promise<void>>()
        .mockResolvedValue(undefined)

      await deleteImageVariants({ removeVariants }, ['first/path', 'second/path'])

      expect(removeVariants).toHaveBeenCalledWith([
        ...getImageVariantPaths('first/path'),
        ...getImageVariantPaths('second/path'),
      ])
    })
  })
})
