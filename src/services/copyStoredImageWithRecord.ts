import { supabase } from '@/lib/supabase'
import { copyImageVariants } from '@/lib/copyImageVariants'
import { getImageVariantPaths } from '@/lib/imageVariantStorage'

export interface StoredImageLocation {
  bucketName: string
  storagePath: string
}

export const copyStoredImageWithRecord = async <T>(
  source: StoredImageLocation,
  destination: StoredImageLocation,
  insertRecord: () => PromiseLike<{ data: T | null; error: Error | null }>,
): Promise<T> => {
  const sourceBucket = supabase.storage.from(source.bucketName)
  const destinationBucket = supabase.storage.from(destination.bucketName)
  const removeDestinationVariants = async (paths: string[]): Promise<void> => {
    const { error } = await destinationBucket.remove(paths)
    if (error) throw error
  }

  await copyImageVariants(
    {
      copyVariant: async (sourcePath, destinationPath) => {
        const { error } = await sourceBucket.copy(sourcePath, destinationPath, {
          destinationBucket: destination.bucketName,
        })
        return { error }
      },
      removeVariants: removeDestinationVariants,
    },
    source.storagePath,
    destination.storagePath,
  )

  const { data, error } = await insertRecord()
  if (data && !error) return data
  await removeDestinationVariants(getImageVariantPaths(destination.storagePath)).catch(
    () => undefined,
  )
  throw error ?? new Error('Bild konnte nicht kopiert werden.')
}
