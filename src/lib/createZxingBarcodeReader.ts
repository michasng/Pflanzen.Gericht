import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import type { BarcodeReader } from '@/composables/useBarcodeScanner'

const SUPPORTED_BARCODE_FORMATS = [BarcodeFormat.EAN_13, BarcodeFormat.UPC_A]

export const createZxingBarcodeReader = (): BarcodeReader => {
  const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_BARCODE_FORMATS]])
  const zxingReader = new BrowserMultiFormatReader(hints)
  return {
    decodeFromVideoDevice: (deviceId, videoElement, callback) =>
      zxingReader.decodeFromVideoDevice(deviceId, videoElement, (result, error, controls) => {
        callback(result ? { text: result.getText() } : undefined, error, controls)
      }),
  }
}
