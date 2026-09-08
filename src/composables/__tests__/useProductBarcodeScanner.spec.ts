import { describe, it, expect, vi } from 'vitest'
import { useProductBarcodeScanner } from '../useProductBarcodeScanner'
import type { OpenFoodFactsProduct } from '@/types/openFoodFacts'
import type { ProductFormValues } from '@/types/productForm'

const noopFetchProductImage = (): Promise<File> => Promise.reject(new Error('unused'))

describe('useProductBarcodeScanner', () => {
  it('given the scanner is opened and closed, toggles the dialog state', () => {
    const scanner = useProductBarcodeScanner({
      fetchProduct: () => Promise.resolve({}),
      mapProductToFormValues: () => ({}),
      fetchProductImage: noopFetchProductImage,
      toErrorMessage: () => 'ignored',
    })

    scanner.openScanner()
    expect(scanner.showScanner.value).toBe(true)

    scanner.closeScanner()
    expect(scanner.showScanner.value).toBe(false)
  })

  it('given loading product data succeeds without an image, returns mapped form values and clears loading state', async () => {
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
      fetchProductImage: noopFetchProductImage,
      toErrorMessage: () => 'ignored',
    })

    scanner.openScanner()
    const resultPromise = scanner.populateFromBarcode('4006381333931')

    expect(scanner.showScanner.value).toBe(false)
    expect(scanner.loadingProduct.value).toBe(true)

    await expect(resultPromise).resolves.toEqual({ values: mappedValues, imageFile: null })
    expect(fetchProduct).toHaveBeenCalledWith('4006381333931')
    expect(mapProductToFormValues).toHaveBeenCalledWith(product)
    expect(scanner.loadingProduct.value).toBe(false)
    expect(scanner.scanErrorMessage.value).toBeNull()
  })

  it('given the product has an image url, fetches and returns the image file', async () => {
    const product: OpenFoodFactsProduct = {
      product_name: 'Soja Drink',
      image_url: 'https://example.com/soja-drink.jpg',
    }
    const imageFile = new File(['data'], 'soja-drink.jpg', { type: 'image/jpeg' })
    const fetchProductImage = vi.fn<(imageUrl: string) => Promise<File>>(() =>
      Promise.resolve(imageFile),
    )
    const scanner = useProductBarcodeScanner({
      fetchProduct: () => Promise.resolve(product),
      mapProductToFormValues: () => ({ name: 'Soja Drink' }),
      fetchProductImage,
      toErrorMessage: () => 'ignored',
    })

    const result = await scanner.populateFromBarcode('4006381333931')

    expect(fetchProductImage).toHaveBeenCalledWith('https://example.com/soja-drink.jpg')
    expect(result?.imageFile).toBe(imageFile)
  })

  it('given fetching the product image fails, still returns the mapped form values without an image', async () => {
    const product: OpenFoodFactsProduct = {
      product_name: 'Soja Drink',
      image_url: 'https://example.com/soja-drink.jpg',
    }
    const scanner = useProductBarcodeScanner({
      fetchProduct: () => Promise.resolve(product),
      mapProductToFormValues: () => ({ name: 'Soja Drink' }),
      fetchProductImage: () => Promise.reject(new Error('network')),
      toErrorMessage: () => 'ignored',
    })

    const result = await scanner.populateFromBarcode('4006381333931')

    expect(result).toEqual({ values: { name: 'Soja Drink' }, imageFile: null })
    expect(scanner.scanErrorMessage.value).toBeNull()
  })

  it('given loading product data fails, exposes a user-facing error and returns null', async () => {
    const error = new Error('network')
    const scanner = useProductBarcodeScanner({
      fetchProduct: () => Promise.reject(error),
      mapProductToFormValues: () => ({}),
      fetchProductImage: noopFetchProductImage,
      toErrorMessage: vi.fn<(error: unknown) => string>(() => 'Benutzerfreundlicher Fehler'),
    })

    await expect(scanner.populateFromBarcode('4006381333931')).resolves.toBeNull()
    expect(scanner.loadingProduct.value).toBe(false)
    expect(scanner.scanErrorMessage.value).toBe('Benutzerfreundlicher Fehler')
  })
})
