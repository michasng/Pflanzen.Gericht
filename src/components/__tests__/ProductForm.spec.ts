import { describe, it, expect, vi, afterEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { DEFAULT_ENERGY_UNIT, EnergyUnit } from '@/config/energy'

vi.mock('@/services/products', () => ({
  searchSimilarProducts: () => Promise.resolve([]),
  fetchIngredientNameSuggestions: () => Promise.resolve([]),
  fetchNutrientNameSuggestions: () => Promise.resolve([]),
}))

vi.mock('@/services/catalog', () => ({
  getImageUrl: () => '',
}))

import ProductForm from '../ProductForm.vue'

const ProductBarcodeScannerStub = defineComponent({
  emits: ['scanned'],
  template:
    '<button type="button" data-test="scan-product" @click="$emit(\'scanned\', { energyJoules: 250000 })"></button>',
})

describe('ProductForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('given kcal is selected when barcode data fills energy, resets the field to the default unit', async () => {
    const wrapper = mount(ProductForm, {
      global: {
        stubs: {
          ImageUpload: true,
          ProductBarcodeScanner: ProductBarcodeScannerStub,
          RouterLink: true,
        },
      },
    })
    const energySelect = wrapper.findAll('select')[2]
    if (!energySelect) throw new Error('Energy select not found.')

    await energySelect.setValue(EnergyUnit.Kilocalorie)
    await wrapper.get('[data-test="scan-product"]').trigger('click')

    const energyInput = wrapper.get('#pf-energy').element
    if (!(energyInput instanceof HTMLInputElement)) throw new Error('Energy input not found.')
    const energySelectElement = energySelect.element
    if (!(energySelectElement instanceof HTMLSelectElement)) {
      throw new Error('Energy unit select not found.')
    }

    expect(energyInput.value).toBe('250')
    expect(energySelectElement.value).toBe(DEFAULT_ENERGY_UNIT)
    expect(wrapper.text()).not.toContain('Bitte gib für die Energie einen gültigen Wert ein.')
  })
})
