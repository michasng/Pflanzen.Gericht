import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BarcodeReader } from '@/composables/useBarcodeScanner'

const decodeFromVideoDevice = vi.fn<BarcodeReader['decodeFromVideoDevice']>()
const constructorArguments: unknown[][] = []

vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: class {
    constructor(...args: unknown[]) {
      constructorArguments.push(args)
    }

    decodeFromVideoDevice = decodeFromVideoDevice
  },
}))

import { createZxingBarcodeReader } from '../createZxingBarcodeReader'

describe('createZxingBarcodeReader', () => {
  beforeEach(() => {
    decodeFromVideoDevice.mockReset()
    constructorArguments.length = 0
  })

  it('creates the zxing reader without restricting barcode formats', () => {
    createZxingBarcodeReader()

    expect(constructorArguments).toEqual([[]])
  })
})
