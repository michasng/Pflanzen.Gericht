import { OPEN_FOOD_FACTS_API_BASE_URL } from '@/config/openFoodFacts'
import type { OpenFoodFactsApiResponse, OpenFoodFactsProduct } from '@/types/openFoodFacts'

const PRODUCT_NOT_FOUND_STATUS = 0

export const fetchOpenFoodFactsProduct = async (barcode: string): Promise<OpenFoodFactsProduct> => {
  let response: Response
  try {
    response = await fetch(`${OPEN_FOOD_FACTS_API_BASE_URL}/${encodeURIComponent(barcode)}.json`)
  } catch {
    throw new Error(
      'Produktdaten konnten nicht abgerufen werden. Bitte prüfe deine Internetverbindung.',
    )
  }
  if (!response.ok) {
    throw new Error('Produktdaten konnten nicht abgerufen werden. Bitte versuche es später erneut.')
  }
  const data = (await response.json()) as OpenFoodFactsApiResponse
  if (data.status === PRODUCT_NOT_FOUND_STATUS || !data.product) {
    throw new Error('Zu diesem Barcode wurde kein Produkt gefunden.')
  }
  return data.product
}
