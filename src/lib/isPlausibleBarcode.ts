const DIGITS_ONLY_PATTERN = /^\d+$/
const VALID_BARCODE_LENGTHS = [8, 12, 13, 14]
const ODD_POSITION_WEIGHT = 3
const EVEN_POSITION_WEIGHT = 1
const CHECK_DIGIT_MODULO = 10

const calculateCheckDigit = (payloadDigits: number[]): number => {
  const weightedSum = [...payloadDigits]
    .reverse()
    .reduce(
      (sum, digit, index) =>
        sum + digit * (index % 2 === 0 ? ODD_POSITION_WEIGHT : EVEN_POSITION_WEIGHT),
      0,
    )
  return (CHECK_DIGIT_MODULO - (weightedSum % CHECK_DIGIT_MODULO)) % CHECK_DIGIT_MODULO
}

/**
 * Checks whether a barcode is a plausible EAN-8, UPC-A, EAN-13 or GTIN-14 code,
 * i.e. it consists only of digits, has one of the expected lengths and its
 * check digit matches the rest of the digits.
 */
export const isPlausibleBarcode = (barcode: string): boolean => {
  if (!DIGITS_ONLY_PATTERN.test(barcode)) return false
  if (!VALID_BARCODE_LENGTHS.includes(barcode.length)) return false

  const digits = barcode.split('').map(Number)
  const [checkDigit, ...reversedPayloadDigits] = [...digits].reverse()
  if (checkDigit === undefined) return false
  const payloadDigits = reversedPayloadDigits.reverse()

  return calculateCheckDigit(payloadDigits) === checkDigit
}
