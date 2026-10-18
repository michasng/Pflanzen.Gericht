import { fetchPriceReportCityNames } from '@/services/prices'
import { fetchIngredientNameSuggestions, fetchNutrientNameSuggestions } from '@/services/products'
import type { NameSuggestionGateway } from '@/services/NameSuggestionGateway'

export const supabaseNameSuggestionGateway: NameSuggestionGateway = {
  fetchIngredientNameSuggestions,
  fetchNutrientNameSuggestions,
  fetchPriceReportCityNames,
}
