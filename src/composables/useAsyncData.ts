import { ref, shallowRef, watch } from 'vue'
import { toErrorMessage } from '@/lib/error'

export const useAsyncData = <Data, Key = void>(
  load: (key: Key) => Promise<Data | null>,
  key?: () => Key,
) => {
  const data = shallowRef<Data | null>(null)
  const loading = ref(true)
  const errorMessage = ref<string | null>(null)
  const notFound = ref(false)
  let latestRequestNumber = 0

  const reload = async (): Promise<void> => {
    latestRequestNumber += 1
    const requestNumber = latestRequestNumber
    const isLatestRequest = (): boolean => requestNumber === latestRequestNumber

    loading.value = true
    errorMessage.value = null
    notFound.value = false
    data.value = null
    try {
      // the key is only absent when Key is void, so an undefined key is the right argument
      const result = await load(key?.() as Key)
      if (!isLatestRequest()) return

      if (result === null) notFound.value = true
      else data.value = result
    } catch (err) {
      if (isLatestRequest()) errorMessage.value = toErrorMessage(err)
    } finally {
      if (isLatestRequest()) loading.value = false
    }
  }

  watch(() => key?.(), reload, { immediate: true })

  return { data, loading, errorMessage, notFound, reload }
}
