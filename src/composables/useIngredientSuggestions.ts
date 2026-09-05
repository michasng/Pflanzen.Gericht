import { ref, onMounted, type Ref } from 'vue'
import { fetchIngredientNameSuggestions } from '@/services/products'

export const useIngredientSuggestions = (): {
  suggestions: Ref<string[]>
  refreshSuggestions: () => Promise<void>
} => {
  const suggestions = ref<string[]>([])

  const refreshSuggestions = async (): Promise<void> => {
    try {
      suggestions.value = await fetchIngredientNameSuggestions()
    } catch {
      suggestions.value = []
    }
  }

  onMounted(refreshSuggestions)

  return { suggestions, refreshSuggestions }
}
