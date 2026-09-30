import { ref, type Ref } from 'vue'

type StoredImage = { id: string; storage_path: string; sort_order: number }

export const useImageUpload = <T extends StoredImage, S = never>(
  uploadFn: (file: File, sortOrder: number) => Promise<unknown>,
  deleteFn: (image: T) => Promise<unknown>,
  copyFn: (source: S, sortOrder: number) => Promise<unknown> = () => Promise.resolve(),
) => {
  const pendingFiles = ref<File[]>([])
  const pendingCopies = ref([]) as Ref<S[]>
  const existingImages = ref([]) as Ref<T[]>
  const stagedForDeletion: T[] = []

  const handleDeleteImage = (image: T): void => {
    stagedForDeletion.push(image)
    existingImages.value = existingImages.value.filter((existing) => existing.id !== image.id)
  }

  const commitImageChanges = async (): Promise<void> => {
    await Promise.all(stagedForDeletion.map((image) => deleteFn(image)))
    const nextSortOrder = existingImages.value.length
    await Promise.all(
      pendingFiles.value.map((file, index) => uploadFn(file, nextSortOrder + index)),
    )
    const nextCopySortOrder = nextSortOrder + pendingFiles.value.length
    await Promise.all(
      pendingCopies.value.map((source, index) => copyFn(source, nextCopySortOrder + index)),
    )
  }

  return { pendingFiles, pendingCopies, existingImages, handleDeleteImage, commitImageChanges }
}
