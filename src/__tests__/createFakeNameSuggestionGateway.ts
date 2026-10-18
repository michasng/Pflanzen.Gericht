import type { NameSuggestionGateway } from '@/services/NameSuggestionGateway'

export const createFakeNameSuggestionGateway = (
  overrides: Partial<NameSuggestionGateway> = {},
): NameSuggestionGateway => ({
  fetchIngredientNameSuggestions: () => Promise.resolve([]),
  fetchNutrientNameSuggestions: () => Promise.resolve([]),
  fetchPriceReportCityNames: () => Promise.resolve([]),
  ...overrides,
})
