import { ref, type Ref } from 'vue'

type StoredImage = { id: string; storage_path: string; sort_order: number }

export const useImageUpload = <T extends StoredImage>(
  uploadFn: (file: File, sortOrder: number) => Promise<unknown>,
  deleteFn: (image: T) => Promise<unknown>,
) => {
  const pendingFiles = ref<File[]>([])
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
  }

  return { pendingFiles, existingImages, handleDeleteImage, commitImageChanges }
}
