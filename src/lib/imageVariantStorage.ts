import { ImageSize } from '@/config/imageSizes'

export interface DeleteImageVariantsDependencies {
  removeVariants: (paths: string[]) => Promise<void>
}

export interface PersistImageVariantsDependencies {
  removeVariants: (paths: string[]) => Promise<void>
  uploadVariant: (path: string, file: File) => Promise<{ error: Error | null }>
}

export const getImageVariantPaths = (storagePath: string): string[] =>
  Object.values(ImageSize).map((size) => `${storagePath}/${size}.webp`)

export const deleteImageVariants = async (
  dependencies: DeleteImageVariantsDependencies,
  storagePaths: string[],
): Promise<void> => {
  const variantPaths = storagePaths.flatMap(getImageVariantPaths)
  if (!variantPaths.length) return
  await dependencies.removeVariants(variantPaths)
}

export const persistImageVariants = async <T>(
  dependencies: PersistImageVariantsDependencies,
  storagePath: string,
  variants: Record<ImageSize, File>,
  persistRecord: () => Promise<T>,
): Promise<T> => {
  const uploadedVariantPaths: string[] = []

  try {
    for (const size of Object.values(ImageSize)) {
      const variantPath = `${storagePath}/${size}.webp`
      const { error } = await dependencies.uploadVariant(variantPath, variants[size])
      if (error) throw error
      uploadedVariantPaths.push(variantPath)
    }

    return await persistRecord()
  } catch (error) {
    if (uploadedVariantPaths.length) {
      await dependencies.removeVariants(uploadedVariantPaths).catch(() => undefined)
    }
    throw error
  }
}
