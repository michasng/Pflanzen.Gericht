import { ref } from 'vue'
import type { ListVisibility } from '@/config/ListVisibility'
import { ListNameClashError } from '@/lib/ListNameClashError'
import { toErrorMessage } from '@/lib/error'
import type { ListInput } from '@/services/ListGateway'

const NAME_REQUIRED_MESSAGE = 'Bitte einen Namen eingeben'
const VISIBILITY_REQUIRED_MESSAGE = 'Bitte Sichtbarkeit wählen'

interface ListFormOptions {
  initialName?: string
  initialVisibility?: ListVisibility
  save: (input: ListInput) => Promise<void>
  onSaved: () => void
}

export const useListForm = ({
  initialName = '',
  initialVisibility,
  save,
  onSaved,
}: ListFormOptions) => {
  const name = ref(initialName)
  const visibility = ref<ListVisibility | null>(initialVisibility ?? null)
  const nameError = ref<string | null>(null)
  const visibilityError = ref<string | null>(null)
  const errorMessage = ref<string | null>(null)
  const saving = ref(false)

  const submit = async (): Promise<void> => {
    if (saving.value) return
    nameError.value = null
    visibilityError.value = null
    errorMessage.value = null

    const trimmedName = name.value.trim()
    if (!trimmedName) nameError.value = NAME_REQUIRED_MESSAGE
    if (!visibility.value) visibilityError.value = VISIBILITY_REQUIRED_MESSAGE
    if (!trimmedName || !visibility.value) return

    saving.value = true
    try {
      await save({ name: trimmedName, visibility: visibility.value })
      onSaved()
    } catch (err) {
      if (err instanceof ListNameClashError) nameError.value = err.message
      else errorMessage.value = toErrorMessage(err)
    } finally {
      saving.value = false
    }
  }

  return { name, visibility, nameError, visibilityError, errorMessage, saving, submit }
}
