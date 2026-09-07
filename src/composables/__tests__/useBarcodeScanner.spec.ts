import { describe, it, expect, vi } from 'vitest'
import {
  useBarcodeScanner,
  type BarcodeReader,
  type BarcodeScannerControls,
} from '../useBarcodeScanner'

const createReader = (
  decodeFromVideoDevice: BarcodeReader['decodeFromVideoDevice'],
): BarcodeReader => ({ decodeFromVideoDevice })

const createControls = (): BarcodeScannerControls => ({ stop: vi.fn<() => void>() })

describe('useBarcodeScanner', () => {
  it('given a barcode is decoded, resolves with its text and stops scanning', async () => {
    const controls = createControls()
    const reader = createReader((_deviceId, _videoElement, callback) => {
      callback({ text: '4006381333931' }, undefined, controls)
      return Promise.resolve(controls)
    })
    const { scanning, startScanning } = useBarcodeScanner(reader)
    const videoElement = document.createElement('video')

    const resultPromise = startScanning(videoElement)

    await expect(resultPromise).resolves.toBe('4006381333931')
    expect(scanning.value).toBe(false)
    expect(controls.stop).toHaveBeenCalledOnce()
  })

  it('given no barcode was found yet in a frame, keeps scanning without an error', async () => {
    const controls = createControls()
    const reader = createReader((_deviceId, _videoElement, callback) => {
      callback(undefined, { name: 'NotFoundException' }, controls)
      return Promise.resolve(controls)
    })
    const { scanning, frameErrorMessage, startScanning } = useBarcodeScanner(reader)

    startScanning(document.createElement('video'))

    expect(scanning.value).toBe(true)
    expect(frameErrorMessage.value).toBeNull()
  })

  it('given a frame fails for an unexpected reason, surfaces a non-blocking error', async () => {
    const controls = createControls()
    const reader = createReader((_deviceId, _videoElement, callback) => {
      callback(undefined, { name: 'FormatException' }, controls)
      return Promise.resolve(controls)
    })
    const { scanning, frameErrorMessage, startScanning } = useBarcodeScanner(reader)

    startScanning(document.createElement('video'))

    expect(scanning.value).toBe(true)
    expect(frameErrorMessage.value).toBe('Barcode konnte nicht erkannt werden.')
  })

  it('given the camera cannot be accessed, rejects and stops scanning', async () => {
    const permissionError = new Error('Permission denied')
    const reader = createReader(() => Promise.reject(permissionError))
    const { scanning, startScanning } = useBarcodeScanner(reader)

    const resultPromise = startScanning(document.createElement('video'))

    await expect(resultPromise).rejects.toBe(permissionError)
    expect(scanning.value).toBe(false)
  })

  it('given stopScanning is called, stops the underlying controls', async () => {
    const controls = createControls()
    const reader = createReader((_deviceId, _videoElement, _callback) => Promise.resolve(controls))
    const { scanning, startScanning, stopScanning } = useBarcodeScanner(reader)

    void startScanning(document.createElement('video'))
    await Promise.resolve()
    stopScanning()

    expect(controls.stop).toHaveBeenCalledOnce()
    expect(scanning.value).toBe(false)
  })
})
