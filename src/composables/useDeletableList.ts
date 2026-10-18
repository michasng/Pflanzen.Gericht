import { ref, type Ref } from 'vue'
import { toErrorMessage } from '@/lib/error'

interface DeletableListOptions<T> {
  items: Ref<T[]>
  deleteItem: (id: string) => Promise<void>
  reportError: (message: string) => void
}

export const useDeletableList = <T extends { id: string }>({
  items,
  deleteItem,
  reportError,
}: DeletableListOptions<T>) => {
  const deletingId = ref<string | null>(null)

  const remove = async (id: string): Promise<void> => {
    deletingId.value = id
    try {
      await deleteItem(id)
      items.value = items.value.filter((item) => item.id !== id)
    } catch (err) {
      reportError(toErrorMessage(err))
    } finally {
      deletingId.value = null
    }
  }

  return { deletingId, remove }
}
