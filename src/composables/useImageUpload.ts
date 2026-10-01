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
  const copiedSources: S[] = []

  const handleDeleteImage = (image: T): void => {
    stagedForDeletion.push(image)
    existingImages.value = existingImages.value.filter((existing) => existing.id !== image.id)
  }

  const commitImageChanges = async (): Promise<void> => {
    await Promise.all(stagedForDeletion.map((image) => deleteFn(image)))
    const nextSortOrder = existingImages.value.reduce(
      (next, image) => Math.max(next, image.sort_order + 1),
      0,
    )
    await Promise.all(
      pendingFiles.value.map((file, index) => uploadFn(file, nextSortOrder + index)),
    )
    const nextCopySortOrder = nextSortOrder + pendingFiles.value.length
    const copiesToCommit = [...pendingCopies.value]
    const results = await Promise.allSettled(
      copiesToCommit.map((source, index) => copyFn(source, nextCopySortOrder + index)),
    )
    const failures = results.filter((result) => result.status === 'rejected')
    const failedCopies = copiesToCommit.filter((_, index) => results[index]?.status === 'rejected')
    copiedSources.push(...copiesToCommit.filter((source) => !failedCopies.includes(source)))
    pendingCopies.value = failedCopies
    const [firstFailure] = failures
    if (firstFailure) throw firstFailure.reason
  }

  const selectCopies = (sources: S[]): void => {
    pendingCopies.value = sources.filter((source) => !copiedSources.includes(source))
  }

  return {
    pendingFiles,
    pendingCopies,
    selectCopies,
    existingImages,
    handleDeleteImage,
    commitImageChanges,
  }
}
