import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductForm from '@/components/ProductForm.vue'

vi.mock('@/services/products', () => ({
  fetchIngredientNameSuggestions: vi.fn<() => Promise<string[]>>().mockResolvedValue([]),
  searchSimilarProducts: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
}))
vi.mock('@/services/catalog', () => ({
  getImageUrl: vi.fn<() => string>(),
}))

const mountForm = () =>
  mount(ProductForm, {
    global: { stubs: { RouterLink: true } },
  })

const fillRequiredFields = async (wrapper: ReturnType<typeof mountForm>): Promise<void> => {
  await wrapper.find('#pf-name').setValue('Hafermilch Original')
  await wrapper.find('#pf-category').setValue('milk')
}

const addIngredientRow = async (wrapper: ReturnType<typeof mountForm>): Promise<void> => {
  await wrapper.find('button:not([type="submit"])').trigger('click')
}

describe('ProductForm', () => {
  describe('given an ingredient with a two-decimal percentage', () => {
    it('accepts the value as valid and submits the form', async () => {
      const wrapper = mountForm()
      await fillRequiredFields(wrapper)
      await addIngredientRow(wrapper)

      const nameInput = wrapper.find('input[list="pf-ingredient-suggestions"]')
      await nameInput.setValue('Hafer')
      const percentageInput = wrapper.find('input[inputmode="decimal"]')
      await percentageInput.setValue('12.34')

      expect((percentageInput.element as HTMLInputElement).checkValidity()).toBe(true)

      await wrapper.find('form').trigger('submit.prevent')

      const submitted = wrapper.emitted('submit')
      expect(submitted).toHaveLength(1)
      expect(submitted?.[0]?.[0]).toMatchObject({
        ingredients: [{ name: 'Hafer', percentage: 12.34, comparator: '=' }],
      })
    })
  })

  describe('given no ingredients were added', () => {
    it('submits an empty ingredients list', async () => {
      const wrapper = mountForm()
      await fillRequiredFields(wrapper)

      await wrapper.find('form').trigger('submit.prevent')

      const submitted = wrapper.emitted('submit')
      expect(submitted?.[0]?.[0]).toMatchObject({ ingredients: [] })
    })
  })

  describe('given an ingredient row without a name', () => {
    it('omits it from the submitted ingredients', async () => {
      const wrapper = mountForm()
      await fillRequiredFields(wrapper)
      await addIngredientRow(wrapper)

      await wrapper.find('form').trigger('submit.prevent')

      const submitted = wrapper.emitted('submit')
      expect(submitted?.[0]?.[0]).toMatchObject({ ingredients: [] })
    })
  })
})
