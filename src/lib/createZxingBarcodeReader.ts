import { BrowserMultiFormatReader } from '@zxing/browser'
import type { BarcodeReader } from '@/composables/useBarcodeScanner'

export const createZxingBarcodeReader = (): BarcodeReader => {
  const zxingReader = new BrowserMultiFormatReader()
  return {
    decodeFromVideoDevice: (deviceId, videoElement, callback) =>
      zxingReader.decodeFromVideoDevice(deviceId, videoElement, (result, error, controls) => {
        callback(result ? { text: result.getText() } : undefined, error, controls)
      }),
  }
}
