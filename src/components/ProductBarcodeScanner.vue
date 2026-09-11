<script setup lang="ts">
import { ref } from 'vue'
import BarcodeScannerDialog from '@/components/BarcodeScannerDialog.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import {
  useProductBarcodeScanner,
  type ProductBarcodeScannerDependencies,
} from '@/composables/useProductBarcodeScanner'
import type { BarcodeReader } from '@/composables/useBarcodeScanner'
import { createZxingBarcodeReader } from '@/lib/createZxingBarcodeReader'
import { toErrorMessage } from '@/lib/error'
import { isPlausibleBarcode } from '@/lib/isPlausibleBarcode'
import { mapOpenFoodFactsProductToFormValues } from '@/lib/mapOpenFoodFactsProductToFormValues'
import { fetchOpenFoodFactsProduct, fetchOpenFoodFactsProductImage } from '@/services/openFoodFacts'
import type { ProductFormValues } from '@/types/productForm'

interface ProductBarcodeScannerComponentDependencies extends ProductBarcodeScannerDependencies {
  createReader: () => BarcodeReader
}

const createDefaultDependencies = (): ProductBarcodeScannerComponentDependencies => ({
  createReader: createZxingBarcodeReader,
  isPlausibleBarcode,
  fetchProduct: fetchOpenFoodFactsProduct,
  mapProductToFormValues: mapOpenFoodFactsProductToFormValues,
  fetchProductImage: fetchOpenFoodFactsProductImage,
  toErrorMessage,
})

const props = defineProps<{
  dependencies?: ProductBarcodeScannerComponentDependencies
}>()
const dependencies = props.dependencies ?? createDefaultDependencies()

const emit = defineEmits<{
  scanned: [values: Partial<ProductFormValues>]
  scannedImage: [file: File]
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
  const result = await populateFromBarcode(barcode)
  if (!result) return
  emit('scanned', result.values)
  if (result.imageFile) emit('scannedImage', result.imageFile)
}

const showManualEntry = ref(false)
const manualBarcode = ref('')

const toggleManualEntry = (): void => {
  showManualEntry.value = !showManualEntry.value
  manualBarcode.value = ''
}

const handleManualSubmit = async (): Promise<void> => {
  const barcode = manualBarcode.value.trim()
  if (!barcode) return
  await handleDecoded(barcode)
  manualBarcode.value = ''
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
    <button
      type="button"
      data-test="toggle-manual-entry"
      :disabled="loadingProduct"
      class="mt-2 w-full text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-60 transition-colors"
      @click="toggleManualEntry"
    >
      {{ showManualEntry ? 'Manuelle Eingabe ausblenden' : 'Barcode manuell eingeben' }}
    </button>
    <form v-if="showManualEntry" class="mt-2 flex gap-2" @submit.prevent="handleManualSubmit">
      <label class="sr-only" for="pbs-manual-barcode">Barcode</label>
      <input
        id="pbs-manual-barcode"
        v-model="manualBarcode"
        type="text"
        inputmode="numeric"
        pattern="\d*"
        placeholder="Barcode eingeben"
        :disabled="loadingProduct"
        class="flex-1 min-w-0 py-2 px-3 border border-gray-200 rounded-lg text-sm disabled:opacity-60"
      />
      <button
        type="submit"
        :disabled="loadingProduct || !manualBarcode.trim()"
        class="py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
      >
        Prüfen
      </button>
    </form>
    <p class="mt-2 text-xs text-gray-600">
      Produktdaten von
      <a
        href="https://world.openfoodfacts.org"
        target="_blank"
        rel="noopener noreferrer"
        class="underline hover:text-gray-900"
      >
        Open Food Facts
      </a>
      , lizenziert unter der
      <a
        href="https://opendatacommons.org/licenses/odbl/1.0/"
        target="_blank"
        rel="noopener noreferrer"
        class="underline hover:text-gray-900"
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
