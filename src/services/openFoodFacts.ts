import { OPEN_FOOD_FACTS_API_BASE_URL } from '@/config/openFoodFacts'
import { isImageFileName } from '@/lib/isImageFileName'
import { isRecord } from '@/lib/typeGuards/isRecord'
import { isStringArray } from '@/lib/typeGuards/isStringArray'
import type {
  OpenFoodFactsApiResponse,
  OpenFoodFactsNutrimentValue,
  OpenFoodFactsProduct,
} from '@/types/openFoodFacts'

const PRODUCT_NOT_FOUND_STATUS = 0
const PRODUCT_FETCH_ERROR_MESSAGE =
  'Produktdaten konnten nicht abgerufen werden. Bitte versuche es später erneut.'
const PRODUCT_NETWORK_ERROR_MESSAGE =
  'Produktdaten konnten nicht abgerufen werden. Bitte prüfe deine Internetverbindung.'
const PRODUCT_RESPONSE_ERROR_MESSAGE =
  'Produktdaten konnten nicht verarbeitet werden. Bitte versuche es später erneut.'
const PRODUCT_IMAGE_FETCH_ERROR_MESSAGE = 'Produktbild konnte nicht abgerufen werden.'
const DEFAULT_PRODUCT_IMAGE_FILE_NAME = 'product-image.jpg'

const isNutrimentRecord = (value: unknown): value is Record<string, OpenFoodFactsNutrimentValue> =>
  isRecord(value) &&
  Object.values(value).every((entry) => typeof entry === 'number' || typeof entry === 'string')

const isOpenFoodFactsIngredient = (value: unknown): boolean =>
  isRecord(value) &&
  (value.text === undefined || typeof value.text === 'string') &&
  (value.percent_estimate === undefined || typeof value.percent_estimate === 'number')

const isOpenFoodFactsProduct = (value: unknown): value is OpenFoodFactsProduct =>
  isRecord(value) &&
  (value.product_name === undefined || typeof value.product_name === 'string') &&
  (value.brands === undefined || typeof value.brands === 'string') &&
  (value.generic_name === undefined || typeof value.generic_name === 'string') &&
  (value.ingredients_text === undefined || typeof value.ingredients_text === 'string') &&
  (value.labels_tags === undefined || isStringArray(value.labels_tags)) &&
  (value.allergens_tags === undefined || isStringArray(value.allergens_tags)) &&
  (value.nutriments === undefined || isNutrimentRecord(value.nutriments)) &&
  (value.ingredients === undefined ||
    (Array.isArray(value.ingredients) && value.ingredients.every(isOpenFoodFactsIngredient))) &&
  (value.image_url === undefined || typeof value.image_url === 'string')

const isOpenFoodFactsApiResponse = (value: unknown): value is OpenFoodFactsApiResponse =>
  isRecord(value) &&
  typeof value.status === 'number' &&
  (value.product === undefined || isOpenFoodFactsProduct(value.product))

const isHttpUrl = (url: URL): boolean => url.protocol === 'http:' || url.protocol === 'https:'

const getImageFileName = (imageUrl: URL): string => {
  const fileName = imageUrl.pathname.split('/').pop() ?? ''
  return fileName || DEFAULT_PRODUCT_IMAGE_FILE_NAME
}

export const fetchOpenFoodFactsProduct = async (barcode: string): Promise<OpenFoodFactsProduct> => {
  let response: Response
  try {
    response = await fetch(`${OPEN_FOOD_FACTS_API_BASE_URL}/${encodeURIComponent(barcode)}.json`)
  } catch {
    throw new Error(PRODUCT_NETWORK_ERROR_MESSAGE)
  }
  if (!response.ok) {
    throw new Error(PRODUCT_FETCH_ERROR_MESSAGE)
  }
  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error(PRODUCT_RESPONSE_ERROR_MESSAGE)
  }
  if (!isOpenFoodFactsApiResponse(data)) {
    throw new Error(PRODUCT_RESPONSE_ERROR_MESSAGE)
  }
  if (data.status === PRODUCT_NOT_FOUND_STATUS || !data.product) {
    throw new Error('Zu diesem Barcode wurde kein Produkt gefunden.')
  }
  return data.product
}

export const fetchOpenFoodFactsProductImage = async (imageUrl: string): Promise<File> => {
  let parsedImageUrl: URL
  try {
    parsedImageUrl = new URL(imageUrl)
  } catch {
    throw new Error(PRODUCT_IMAGE_FETCH_ERROR_MESSAGE)
  }
  if (!isHttpUrl(parsedImageUrl)) {
    throw new Error(PRODUCT_IMAGE_FETCH_ERROR_MESSAGE)
  }
  let response: Response
  try {
    response = await fetch(imageUrl)
  } catch {
    throw new Error(PRODUCT_IMAGE_FETCH_ERROR_MESSAGE)
  }
  if (!response.ok) {
    throw new Error(PRODUCT_IMAGE_FETCH_ERROR_MESSAGE)
  }
  const contentType = response.headers.get('Content-Type')?.split(';')[0]?.trim() ?? ''
  const fileName = getImageFileName(parsedImageUrl)
  if (
    (contentType && !contentType.startsWith('image/')) ||
    (!contentType && !isImageFileName(fileName))
  ) {
    throw new Error(PRODUCT_IMAGE_FETCH_ERROR_MESSAGE)
  }
  const imageBlob = await response.blob()
  return new File([imageBlob], fileName, { type: contentType || imageBlob.type })
}
