import { describe, it, expect, vi } from 'vitest'
import { defineComponent } from 'vue'
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
      isPlausibleBarcode: (): boolean => true,
      fetchProduct: vi.fn<(barcode: string) => Promise<OpenFoodFactsProduct>>(() =>
        Promise.resolve(product),
      ),
      mapProductToFormValues: vi.fn<(product: OpenFoodFactsProduct) => Partial<ProductFormValues>>(
        () => mappedValues,
      ),
      fetchProductImage: vi.fn<(imageUrl: string) => Promise<File>>(() =>
        Promise.reject(new Error('unused')),
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
    await dependencies.fetchProduct.mock.results[0]?.value

    expect(dependencies.fetchProduct).toHaveBeenCalledWith('4006381333931')
    expect(dependencies.mapProductToFormValues).toHaveBeenCalledWith(product)
    expect(wrapper.emitted('scanned')).toEqual([[{ ...mappedValues, barcode: '4006381333931' }]])
  })

  it('given a scanned product has an image, emits the image file', async () => {
    const product: OpenFoodFactsProduct = {
      product_name: 'Soja Drink',
      image_url: 'https://example.com/soja-drink.jpg',
    }
    const imageFile = new File(['data'], 'soja-drink.jpg', { type: 'image/jpeg' })
    const dependencies = {
      createReader: (): BarcodeReader => ({
        decodeFromVideoDevice: () => Promise.reject(new Error('unused')),
      }),
      isPlausibleBarcode: (): boolean => true,
      fetchProduct: vi.fn<(barcode: string) => Promise<OpenFoodFactsProduct>>(() =>
        Promise.resolve(product),
      ),
      mapProductToFormValues: vi.fn<(product: OpenFoodFactsProduct) => Partial<ProductFormValues>>(
        () => ({ name: 'Soja Drink' }),
      ),
      fetchProductImage: vi.fn<(imageUrl: string) => Promise<File>>(() =>
        Promise.resolve(imageFile),
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
    await dependencies.fetchProduct.mock.results[0]?.value
    await dependencies.fetchProductImage.mock.results[0]?.value

    expect(wrapper.emitted('scannedImage')).toEqual([[imageFile]])
  })

  it('given a barcode was entered manually, emits mapped form values', async () => {
    const product: OpenFoodFactsProduct = { product_name: 'Soja Drink' }
    const mappedValues: Partial<ProductFormValues> = { name: 'Soja Drink' }
    const dependencies = {
      createReader: (): BarcodeReader => ({
        decodeFromVideoDevice: () => Promise.reject(new Error('unused')),
      }),
      isPlausibleBarcode: (): boolean => true,
      fetchProduct: vi.fn<(barcode: string) => Promise<OpenFoodFactsProduct>>(() =>
        Promise.resolve(product),
      ),
      mapProductToFormValues: vi.fn<(product: OpenFoodFactsProduct) => Partial<ProductFormValues>>(
        () => mappedValues,
      ),
      fetchProductImage: vi.fn<(imageUrl: string) => Promise<File>>(() =>
        Promise.reject(new Error('unused')),
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

    await wrapper.get('[data-test="toggle-manual-entry"]').trigger('click')
    const barcodeInput = wrapper.get('input#pbs-manual-barcode')
    await barcodeInput.setValue('4006381333931')
    await barcodeInput.trigger('keydown.enter')
    await dependencies.fetchProduct.mock.results[0]?.value

    expect(dependencies.fetchProduct).toHaveBeenCalledWith('4006381333931')
    expect(wrapper.emitted('scanned')).toEqual([[{ ...mappedValues, barcode: '4006381333931' }]])
  })

  it('given a manually entered barcode has an implausible format, shows an error without fetching the product', async () => {
    const dependencies = {
      createReader: (): BarcodeReader => ({
        decodeFromVideoDevice: () => Promise.reject(new Error('unused')),
      }),
      isPlausibleBarcode: (): boolean => false,
      fetchProduct: vi.fn<(barcode: string) => Promise<OpenFoodFactsProduct>>(() =>
        Promise.reject(new Error('unused')),
      ),
      mapProductToFormValues: vi.fn<(product: OpenFoodFactsProduct) => Partial<ProductFormValues>>(
        () => ({}),
      ),
      fetchProductImage: vi.fn<(imageUrl: string) => Promise<File>>(() =>
        Promise.reject(new Error('unused')),
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

    await wrapper.get('[data-test="toggle-manual-entry"]').trigger('click')
    await wrapper.get('input#pbs-manual-barcode').setValue('not-a-barcode')
    await wrapper.get('button[aria-label="Barcode prüfen"]').trigger('click')

    expect(dependencies.fetchProduct).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toBe('Dieser Barcode hat kein gültiges Format.')
  })
})
