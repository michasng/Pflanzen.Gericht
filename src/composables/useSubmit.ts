import { ref } from 'vue'
import { toErrorMessage } from '@/lib/error'

export const useSubmit = <Values extends unknown[]>(
  action: (...values: Values) => Promise<void>,
) => {
  const submitting = ref(false)
  const errorMessage = ref<string | null>(null)

  const submit = async (...values: Values): Promise<void> => {
    if (submitting.value) return
    submitting.value = true
    errorMessage.value = null
    try {
      await action(...values)
    } catch (err) {
      errorMessage.value = toErrorMessage(err)
      submitting.value = false
    }
  }

  return { submitting, errorMessage, submit }
}
