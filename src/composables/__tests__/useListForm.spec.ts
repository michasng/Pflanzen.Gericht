import { describe, expect, it } from 'vitest'
import { ListVisibility } from '@/config/ListVisibility'
import { useListForm } from '@/composables/useListForm'
import { ListNameClashError } from '@/lib/ListNameClashError'
import type { ListInput } from '@/services/ListGateway'

const createForm = (save: (input: ListInput) => Promise<void> = () => Promise.resolve()) => {
  const savedInputs: ListInput[] = []
  let savedCount = 0
  const form = useListForm({
    save: (input) => {
      savedInputs.push(input)
      return save(input)
    },
    onSaved: () => {
      savedCount += 1
    },
  })
  return { form, savedInputs, getSavedCount: () => savedCount }
}

describe('useListForm', () => {
  describe('given no visibility was chosen', () => {
    it('asks for a visibility and does not save', async () => {
      const { form, savedInputs } = createForm()
      form.name.value = 'Favoriten'

      await form.submit()

      expect(form.visibilityError.value).toBe('Bitte Sichtbarkeit wählen')
      expect(savedInputs).toEqual([])
    })
  })

  describe('given the name is blank', () => {
    it('asks for a name and does not save', async () => {
      const { form, savedInputs } = createForm()
      form.name.value = '   '
      form.visibility.value = ListVisibility.Private

      await form.submit()

      expect(form.nameError.value).toBe('Bitte einen Namen eingeben')
      expect(savedInputs).toEqual([])
    })
  })

  describe('given a name and a visibility', () => {
    it('saves the trimmed name and reports success', async () => {
      const { form, savedInputs, getSavedCount } = createForm()
      form.name.value = '  Favoriten '
      form.visibility.value = ListVisibility.Public

      await form.submit()

      expect(savedInputs).toEqual([{ name: 'Favoriten', visibility: ListVisibility.Public }])
      expect(getSavedCount()).toBe(1)
    })
  })

  describe('when a list with that name exists', () => {
    it('shows the name clash on the name', async () => {
      const { form, getSavedCount } = createForm(() => Promise.reject(new ListNameClashError()))
      form.name.value = 'Favoriten'
      form.visibility.value = ListVisibility.Public

      await form.submit()

      expect(form.nameError.value).toBe('Du hast bereits eine Liste mit diesem Namen.')
      expect(getSavedCount()).toBe(0)
    })
  })

  describe('when saving fails otherwise', () => {
    it('shows the error', async () => {
      const { form } = createForm(() => Promise.reject(new Error('offline')))
      form.name.value = 'Favoriten'
      form.visibility.value = ListVisibility.Public

      await form.submit()

      expect(form.errorMessage.value).toBe('offline')
    })
  })

  describe('given an earlier validation error', () => {
    it('clears it on the next submit', async () => {
      const { form } = createForm()
      form.name.value = 'Favoriten'
      await form.submit()

      form.visibility.value = ListVisibility.Public
      await form.submit()

      expect(form.visibilityError.value).toBeNull()
    })
  })
})
