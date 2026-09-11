import { describe, it, expect } from 'vitest'
import { isPlausibleBarcode } from '../isPlausibleBarcode'

describe('isPlausibleBarcode', () => {
  it('given a valid EAN-8 barcode, returns true', () => {
    expect(isPlausibleBarcode('40170725')).toBe(true)
  })

  it('given a valid UPC-A barcode, returns true', () => {
    expect(isPlausibleBarcode('036000291452')).toBe(true)
  })

  it('given a valid EAN-13 barcode, returns true', () => {
    expect(isPlausibleBarcode('4006381333931')).toBe(true)
  })

  it('given a valid GTIN-14 barcode, returns true', () => {
    expect(isPlausibleBarcode('14006381333938')).toBe(true)
  })

  it('given a barcode with a wrong check digit, returns false', () => {
    expect(isPlausibleBarcode('4006381333930')).toBe(false)
  })

  it('given a barcode with an implausible length, returns false', () => {
    expect(isPlausibleBarcode('123456')).toBe(false)
  })

  it('given a barcode containing non-digit characters, returns false', () => {
    expect(isPlausibleBarcode('400638133393a')).toBe(false)
  })

  it('given an empty barcode, returns false', () => {
    expect(isPlausibleBarcode('')).toBe(false)
  })
})
