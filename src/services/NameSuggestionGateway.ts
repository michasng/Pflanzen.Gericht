import type { InjectionKey } from 'vue'

export const nameSuggestionGatewayKey: InjectionKey<NameSuggestionGateway> =
  Symbol('nameSuggestionGateway')

export interface NameSuggestionGateway {
  fetchIngredientNameSuggestions: () => Promise<string[]>
  fetchNutrientNameSuggestions: () => Promise<string[]>
  fetchPriceReportCityNames: (store: string) => Promise<string[]>
}
