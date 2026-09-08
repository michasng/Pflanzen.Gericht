import { describe, it, expect, vi } from 'vitest'
import { useProductBarcodeScanner } from '../useProductBarcodeScanner'
import type { OpenFoodFactsProduct } from '@/types/openFoodFacts'
import type { ProductFormValues } from '@/types/productForm'

describe('useProductBarcodeScanner', () => {
  it('given the scanner is opened and closed, toggles the dialog state', () => {
    const scanner = useProductBarcodeScanner({
      fetchProduct: () => Promise.resolve({}),
      mapProductToFormValues: () => ({}),
      toErrorMessage: () => 'ignored',
    })

    scanner.openScanner()
    expect(scanner.showScanner.value).toBe(true)

    scanner.closeScanner()
    expect(scanner.showScanner.value).toBe(false)
  })

  it('given loading product data succeeds, returns mapped form values and clears loading state', async () => {
    const product: OpenFoodFactsProduct = { product_name: 'Soja Drink' }
    const mappedValues: Partial<ProductFormValues> = { name: 'Soja Drink' }
    const fetchProduct = vi.fn<(barcode: string) => Promise<OpenFoodFactsProduct>>(() =>
      Promise.resolve(product),
    )
    const mapProductToFormValues = vi.fn<
      (product: OpenFoodFactsProduct) => Partial<ProductFormValues>
    >(() => mappedValues)
    const scanner = useProductBarcodeScanner({
      fetchProduct,
      mapProductToFormValues,
      toErrorMessage: () => 'ignored',
    })

    scanner.openScanner()
    const resultPromise = scanner.populateFromBarcode('4006381333931')

    expect(scanner.showScanner.value).toBe(false)
    expect(scanner.loadingProduct.value).toBe(true)

    await expect(resultPromise).resolves.toEqual(mappedValues)
    expect(fetchProduct).toHaveBeenCalledWith('4006381333931')
    expect(mapProductToFormValues).toHaveBeenCalledWith(product)
    expect(scanner.loadingProduct.value).toBe(false)
    expect(scanner.scanErrorMessage.value).toBeNull()
  })

  it('given loading product data fails, exposes a user-facing error and returns null', async () => {
    const error = new Error('network')
    const scanner = useProductBarcodeScanner({
      fetchProduct: () => Promise.reject(error),
      mapProductToFormValues: () => ({}),
      toErrorMessage: vi.fn<(error: unknown) => string>(() => 'Benutzerfreundlicher Fehler'),
    })

    await expect(scanner.populateFromBarcode('4006381333931')).resolves.toBeNull()
    expect(scanner.loadingProduct.value).toBe(false)
    expect(scanner.scanErrorMessage.value).toBe('Benutzerfreundlicher Fehler')
  })
})
