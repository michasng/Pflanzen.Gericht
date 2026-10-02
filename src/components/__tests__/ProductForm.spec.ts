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
import type { ProductFormValues } from '@/types/productForm'

const ProductBarcodeScannerStub = defineComponent({
  emits: ['scanned'],
  template:
    '<button type="button" data-test="scan-product" @click="$emit(\'scanned\', { energyJoules: 250000, barcode: \'4006381333931\' })"></button>',
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

  it('given a barcode was scanned, displays it and submits it with the form', async () => {
    const wrapper = mount(ProductForm, {
      global: {
        stubs: {
          ImageUpload: true,
          ProductBarcodeScanner: ProductBarcodeScannerStub,
          RouterLink: true,
        },
      },
    })

    await wrapper.get('[data-test="scan-product"]').trigger('click')

    const barcodeInput = wrapper.get('#pf-barcode').element
    if (!(barcodeInput instanceof HTMLInputElement)) throw new Error('Barcode input not found.')
    expect(barcodeInput.value).toBe('4006381333931')

    await wrapper.get('#pf-name').setValue('Soja Drink')
    await wrapper.get('#pf-category').setValue('drink')
    await wrapper.get('form').trigger('submit')

    const emittedValues = wrapper.emitted('submit')?.[0]?.[0] as { barcode: string | null }
    expect(emittedValues.barcode).toBe('4006381333931')
  })

  it('given a scanned barcode, removes it when the remove button is clicked', async () => {
    const wrapper = mount(ProductForm, {
      global: {
        stubs: {
          ImageUpload: true,
          ProductBarcodeScanner: ProductBarcodeScannerStub,
          RouterLink: true,
        },
      },
    })

    await wrapper.get('[data-test="scan-product"]').trigger('click')
    await wrapper.get('[aria-label="Barcode entfernen"]').trigger('click')
    await wrapper.get('#pf-name').setValue('Soja Drink')
    await wrapper.get('#pf-category').setValue('drink')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.find('#pf-barcode').exists()).toBe(false)
    const emittedValues = wrapper.emitted('submit')?.[0]?.[0] as { barcode: string | null }
    expect(emittedValues.barcode).toBeNull()
  })

  describe('given a comparison of two products', () => {
    const buildValues = (overrides: Partial<ProductFormValues>): ProductFormValues => ({
      name: '',
      category: 'drink',
      base: null,
      brand: null,
      description: null,
      energyJoules: null,
      allergens: [],
      isOrganic: false,
      barcode: null,
      ingredients: [],
      nutrients: [],
      ...overrides,
    })
    const comparison = {
      a: buildValues({ name: 'Name A', allergens: ['soy'] }),
      b: buildValues({ name: 'Name B' }),
    }

    it('copies the accepted values into the editable fields', async () => {
      const wrapper = mount(ProductForm, {
        props: { comparison },
        global: { stubs: { ImageUpload: true, RouterLink: true } },
      })

      await wrapper.get('[aria-label="Name, User B: Name B akzeptieren"]').trigger('click')
      await wrapper.get('[aria-label="Soja, User A: Ja akzeptieren"]').trigger('click')
      await wrapper.get('form').trigger('submit')

      expect(wrapper.get<HTMLInputElement>('#pf-name').element.value).toBe('Name B')
      expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
        name: 'Name B',
        allergens: ['soy'],
      })
    })

    it('replaces the ingredients with the accepted side', async () => {
      const ingredientComparison = {
        a: buildValues({
          ingredients: [{ name: 'Hafer', fractionBasisPoints: 1000, comparator: '=' }],
        }),
        b: buildValues({}),
      }
      const wrapper = mount(ProductForm, {
        props: { comparison: ingredientComparison },
        global: { stubs: { ImageUpload: true, RouterLink: true } },
      })

      await wrapper.get('[aria-label="Zutaten, User A: Hafer 10 % akzeptieren"]').trigger('click')
      await wrapper.get('form').trigger('submit')

      expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
        ingredients: [{ name: 'Hafer', fractionBasisPoints: 1000, comparator: '=' }],
      })
    })

    it('replaces the nutrients with the accepted side', async () => {
      const nutrientComparison = {
        a: buildValues({}),
        b: buildValues({ nutrients: [{ name: 'Protein', amountMicrograms: 3_000_000 }] }),
      }
      const wrapper = mount(ProductForm, {
        props: { comparison: nutrientComparison },
        global: { stubs: { ImageUpload: true, RouterLink: true } },
      })

      await wrapper
        .get('[aria-label="Nährwerte, User B: Protein 3 g akzeptieren"]')
        .trigger('click')
      await wrapper.get('form').trigger('submit')

      expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
        nutrients: [{ name: 'Protein', amountMicrograms: 3_000_000 }],
      })
    })
  })
})
