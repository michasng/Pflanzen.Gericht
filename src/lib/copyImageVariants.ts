import { ImageSize } from '@/config/imageSizes'

export interface CopyImageVariantsDependencies {
  copyVariant: (sourcePath: string, destinationPath: string) => Promise<{ error: Error | null }>
  removeVariants: (paths: string[]) => Promise<void>
}

export const copyImageVariants = async (
  dependencies: CopyImageVariantsDependencies,
  sourceStoragePath: string,
  destinationStoragePath: string,
): Promise<void> => {
  const copiedPaths: string[] = []
  try {
    for (const size of Object.values(ImageSize)) {
      const destinationPath = `${destinationStoragePath}/${size}.webp`
      const { error } = await dependencies.copyVariant(
        `${sourceStoragePath}/${size}.webp`,
        destinationPath,
      )
      if (error) throw error
      copiedPaths.push(destinationPath)
    }
  } catch (error) {
    if (copiedPaths.length) await dependencies.removeVariants(copiedPaths).catch(() => undefined)
    throw error
  }
}
