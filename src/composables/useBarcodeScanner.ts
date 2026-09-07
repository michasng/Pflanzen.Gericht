import { ref, type Ref } from 'vue'

export interface DecodedBarcode {
  text: string
}

export interface BarcodeScannerControls {
  stop: () => void
}

export type DecodeCallback = (
  barcode: DecodedBarcode | undefined,
  error: unknown,
  controls: BarcodeScannerControls,
) => void

export interface BarcodeReader {
  decodeFromVideoDevice: (
    deviceId: string | undefined,
    videoElement: HTMLVideoElement,
    callback: DecodeCallback,
  ) => Promise<BarcodeScannerControls>
}

const NOT_FOUND_EXCEPTION_NAME = 'NotFoundException'

const isFrameWithoutBarcode = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  error.name === NOT_FOUND_EXCEPTION_NAME

export const useBarcodeScanner = (
  reader: BarcodeReader,
): {
  scanning: Ref<boolean>
  frameErrorMessage: Ref<string | null>
  startScanning: (videoElement: HTMLVideoElement) => Promise<string>
  stopScanning: () => void
} => {
  const scanning = ref(false)
  const frameErrorMessage = ref<string | null>(null)
  let controls: BarcodeScannerControls | null = null

  const stopScanning = (): void => {
    controls?.stop()
    controls = null
    scanning.value = false
  }

  const startScanning = (videoElement: HTMLVideoElement): Promise<string> => {
    frameErrorMessage.value = null
    scanning.value = true
    return new Promise<string>((resolve, reject) => {
      reader
        .decodeFromVideoDevice(undefined, videoElement, (barcode, error, nextControls) => {
          controls = nextControls
          if (barcode) {
            stopScanning()
            resolve(barcode.text)
            return
          }
          frameErrorMessage.value = isFrameWithoutBarcode(error)
            ? null
            : 'Barcode konnte nicht erkannt werden.'
        })
        .then((nextControls) => {
          controls = nextControls
        })
        .catch((error: unknown) => {
          scanning.value = false
          reject(error)
        })
    })
  }

  return { scanning, frameErrorMessage, startScanning, stopScanning }
}
