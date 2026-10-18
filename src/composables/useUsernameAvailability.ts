import { onScopeDispose, ref, watch, type Ref } from 'vue'
import { toErrorMessage } from '@/lib/error'

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30
export const USERNAME_CHECK_DEBOUNCE_MILLISECONDS = 350
export const USERNAME_FORMAT_PATTERN = new RegExp(
  `^[a-z0-9_]{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$`,
)

export interface UsernameAvailability {
  isAvailable: Ref<boolean | null>
  isChecking: Ref<boolean>
  checkError: Ref<string | null>
}

export const useUsernameAvailability = (
  username: Ref<string>,
  checkAvailability: (username: string) => Promise<boolean>,
): UsernameAvailability => {
  const isAvailable = ref<boolean | null>(null)
  const isChecking = ref(false)
  const checkError = ref<string | null>(null)
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let latestRequestId = 0

  const cancelPending = (): void => {
    clearTimeout(debounceTimer)
    latestRequestId++
  }

  const runCheck = async (checkedUsername: string, requestId: number): Promise<void> => {
    try {
      const available = await checkAvailability(checkedUsername)
      if (requestId !== latestRequestId) return
      isAvailable.value = available
    } catch (err) {
      if (requestId !== latestRequestId) return
      checkError.value = toErrorMessage(err)
    }
    isChecking.value = false
  }

  watch(
    username,
    (value) => {
      cancelPending()
      isAvailable.value = null
      checkError.value = null
      isChecking.value = false
      if (!USERNAME_FORMAT_PATTERN.test(value)) return

      isChecking.value = true
      const requestId = latestRequestId
      debounceTimer = setTimeout(
        () => runCheck(value, requestId),
        USERNAME_CHECK_DEBOUNCE_MILLISECONDS,
      )
    },
    { flush: 'sync' },
  )

  onScopeDispose(cancelPending)

  return { isAvailable, isChecking, checkError }
}
