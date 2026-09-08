import { ref, type Ref } from 'vue'
import type { OpenFoodFactsProduct } from '@/types/openFoodFacts'
import type { ProductFormValues } from '@/types/productForm'

export interface ProductBarcodeScannerDependencies {
  fetchProduct: (barcode: string) => Promise<OpenFoodFactsProduct>
  mapProductToFormValues: (product: OpenFoodFactsProduct) => Partial<ProductFormValues>
  toErrorMessage: (error: unknown) => string
}

export const useProductBarcodeScanner = (
  dependencies: ProductBarcodeScannerDependencies,
): {
  showScanner: Ref<boolean>
  loadingProduct: Ref<boolean>
  scanErrorMessage: Ref<string | null>
  openScanner: () => void
  closeScanner: () => void
  populateFromBarcode: (barcode: string) => Promise<Partial<ProductFormValues> | null>
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

  const populateFromBarcode = async (
    barcode: string,
  ): Promise<Partial<ProductFormValues> | null> => {
    closeScanner()
    loadingProduct.value = true
    scanErrorMessage.value = null

    try {
      const product = await dependencies.fetchProduct(barcode)
      return dependencies.mapProductToFormValues(product)
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
