import { describe, it, expect, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import ProductBarcodeScanner from '../ProductBarcodeScanner.vue'
import type { BarcodeReader } from '@/composables/useBarcodeScanner'
import type { OpenFoodFactsProduct } from '@/types/openFoodFacts'
import type { ProductFormValues } from '@/types/productForm'

const BarcodeScannerDialogStub = defineComponent({
  props: {
    createReader: {
      type: Function,
      required: true,
    },
  },
  emits: ['decoded', 'cancel'],
  template:
    '<button type="button" data-test="decode-barcode" @click="$emit(\'decoded\', \'4006381333931\')"></button>',
})

describe('ProductBarcodeScanner', () => {
  it('given a barcode was decoded, emits mapped form values', async () => {
    const product: OpenFoodFactsProduct = { product_name: 'Soja Drink' }
    const mappedValues: Partial<ProductFormValues> = { name: 'Soja Drink' }
    const dependencies = {
      createReader: (): BarcodeReader => ({
        decodeFromVideoDevice: () => Promise.reject(new Error('unused')),
      }),
      fetchProduct: vi.fn<(barcode: string) => Promise<OpenFoodFactsProduct>>(() =>
        Promise.resolve(product),
      ),
      mapProductToFormValues: vi.fn<(product: OpenFoodFactsProduct) => Partial<ProductFormValues>>(
        () => mappedValues,
      ),
      toErrorMessage: vi.fn<(error: unknown) => string>(() => 'ignored'),
    }

    const wrapper = mount(ProductBarcodeScanner, {
      props: { dependencies },
      global: {
        stubs: {
          BarcodeScannerDialog: BarcodeScannerDialogStub,
        },
      },
    })

    await wrapper.get('button').trigger('click')
    await wrapper.get('[data-test="decode-barcode"]').trigger('click')
    await Promise.resolve()
    await nextTick()

    expect(dependencies.fetchProduct).toHaveBeenCalledWith('4006381333931')
    expect(dependencies.mapProductToFormValues).toHaveBeenCalledWith(product)
    expect(wrapper.emitted('scanned')).toEqual([[mappedValues]])
  })
})
