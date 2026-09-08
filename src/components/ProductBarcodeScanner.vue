<script setup lang="ts">
import BarcodeScannerDialog from '@/components/BarcodeScannerDialog.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import {
  useProductBarcodeScanner,
  type ProductBarcodeScannerDependencies,
} from '@/composables/useProductBarcodeScanner'
import type { BarcodeReader } from '@/composables/useBarcodeScanner'
import { createZxingBarcodeReader } from '@/lib/createZxingBarcodeReader'
import { toErrorMessage } from '@/lib/error'
import { mapOpenFoodFactsProductToFormValues } from '@/lib/mapOpenFoodFactsProductToFormValues'
import { fetchOpenFoodFactsProduct } from '@/services/openFoodFacts'
import type { ProductFormValues } from '@/types/productForm'

interface ProductBarcodeScannerComponentDependencies extends ProductBarcodeScannerDependencies {
  createReader: () => BarcodeReader
}

const createDefaultDependencies = (): ProductBarcodeScannerComponentDependencies => ({
  createReader: createZxingBarcodeReader,
  fetchProduct: fetchOpenFoodFactsProduct,
  mapProductToFormValues: mapOpenFoodFactsProductToFormValues,
  toErrorMessage,
})

const props = defineProps<{
  dependencies?: ProductBarcodeScannerComponentDependencies
}>()
const dependencies = props.dependencies ?? createDefaultDependencies()

const emit = defineEmits<{
  scanned: [values: Partial<ProductFormValues>]
}>()

const {
  showScanner,
  loadingProduct,
  scanErrorMessage,
  openScanner,
  closeScanner,
  populateFromBarcode,
} = useProductBarcodeScanner(dependencies)

const handleDecoded = async (barcode: string): Promise<void> => {
  const values = await populateFromBarcode(barcode)
  if (values) emit('scanned', values)
}
</script>

<template>
  <div>
    <button
      type="button"
      :disabled="loadingProduct"
      class="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      @click="openScanner"
    >
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3.75 4.5v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 4.5v4.5m0-4.5h-4.5m4.5 0L15 9M3.75 19.5v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 19.5v-4.5m0 4.5h-4.5m4.5 0L15 15M9 9h6v6H9V9z"
        />
      </svg>
      {{ loadingProduct ? 'Produkt wird geladen …' : 'Barcode scannen' }}
    </button>
    <p class="mt-2 text-xs text-gray-400">
      Produktdaten von
      <a
        href="https://world.openfoodfacts.org"
        target="_blank"
        rel="noopener noreferrer"
        class="underline hover:text-gray-600"
      >
        Open Food Facts
      </a>
      , lizenziert unter der
      <a
        href="https://opendatacommons.org/licenses/odbl/1.0/"
        target="_blank"
        rel="noopener noreferrer"
        class="underline hover:text-gray-600"
      >
        Open Database License (ODbL)
      </a>
      .
    </p>
    <AlertMessage :message="scanErrorMessage" class="mt-2" />
  </div>

  <BarcodeScannerDialog
    v-if="showScanner"
    :create-reader="dependencies.createReader"
    @decoded="handleDecoded"
    @cancel="closeScanner"
  />
</template>
