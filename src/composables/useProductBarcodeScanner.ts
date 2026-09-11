import { ref, type Ref } from 'vue'
import type { OpenFoodFactsProduct } from '@/types/openFoodFacts'
import type { ProductFormValues } from '@/types/productForm'

export interface ScannedProductData {
  values: Partial<ProductFormValues>
  imageFile: File | null
}

export interface ProductBarcodeScannerDependencies {
  isPlausibleBarcode: (barcode: string) => boolean
  fetchProduct: (barcode: string) => Promise<OpenFoodFactsProduct>
  mapProductToFormValues: (product: OpenFoodFactsProduct) => Partial<ProductFormValues>
  fetchProductImage: (imageUrl: string) => Promise<File>
  toErrorMessage: (error: unknown) => string
}

const IMPLAUSIBLE_BARCODE_ERROR_MESSAGE = 'Dieser Barcode hat kein gültiges Format.'

export const useProductBarcodeScanner = (
  dependencies: ProductBarcodeScannerDependencies,
): {
  showScanner: Ref<boolean>
  loadingProduct: Ref<boolean>
  scanErrorMessage: Ref<string | null>
  openScanner: () => void
  closeScanner: () => void
  populateFromBarcode: (barcode: string) => Promise<ScannedProductData | null>
} => {
  const showScanner = ref(false)
  const loadingProduct = ref(false)
  const scanErrorMessage = ref<string | null>(null)

  const openScanner = (): void => {
    showScanner.value = true
  }

  const closeScanner = (): void => {
    showScanner.value = false
  }

  const populateFromBarcode = async (barcode: string): Promise<ScannedProductData | null> => {
    closeScanner()
    scanErrorMessage.value = null

    if (!dependencies.isPlausibleBarcode(barcode)) {
      scanErrorMessage.value = IMPLAUSIBLE_BARCODE_ERROR_MESSAGE
      return null
    }

    loadingProduct.value = true
    try {
      const product = await dependencies.fetchProduct(barcode)
      const values = { ...dependencies.mapProductToFormValues(product), barcode }
      const imageFile = product.image_url
        ? await dependencies.fetchProductImage(product.image_url).catch(() => null)
        : null
      return { values, imageFile }
    } catch (error) {
      scanErrorMessage.value = dependencies.toErrorMessage(error)
      return null
    } finally {
      loadingProduct.value = false
    }
  }

  return {
    showScanner,
    loadingProduct,
    scanErrorMessage,
    openScanner,
    closeScanner,
    populateFromBarcode,
  }
}
