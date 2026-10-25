<script setup lang="ts">
import { computed, onUnmounted, ref, useId, watch } from 'vue'
import AppLogo from '@/components/AppLogo.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import Image from '@/components/primitives/ImageComponent.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import { ImageBucket } from '@/config/imageBucket'
import { ImageSize } from '@/config/imageSizes'
import { injectGateway } from '@/composables/injectGateway'
import { toErrorMessage } from '@/lib/error'
import type { ProductSearchSuggestion } from '@/lib/ProductSearchSuggestion'
import { imageUrlGatewayKey } from '@/services/ImageUrlGateway'

const SEARCH_DEBOUNCE_MILLISECONDS = 250

const props = defineProps<{
  search: (term: string) => Promise<ProductSearchSuggestion[]>
  select: (productId: string) => Promise<void>
}>()

const { getImageUrl } = injectGateway(imageUrlGatewayKey)

const term = ref('')
const searchLoading = ref(false)
const searchError = ref<string | null>(null)
const suggestions = ref<ProductSearchSuggestion[]>([])
const isSuggestionListOpen = ref(false)
const highlightedSuggestionIndex = ref(-1)
const selecting = ref(false)

let searchTimeout: ReturnType<typeof setTimeout> | null = null
const suggestionListId = useId()
const searchInputId = useId()

const hasVisibleSuggestions = computed(
  () => isSuggestionListOpen.value && term.value.trim().length > 0 && suggestions.value.length > 0,
)
const activeDescendantId = computed(() => {
  if (!hasVisibleSuggestions.value) return undefined
  if (
    highlightedSuggestionIndex.value < 0 ||
    highlightedSuggestionIndex.value >= suggestions.value.length
  ) {
    return undefined
  }
  return `${suggestionListId}-option-${highlightedSuggestionIndex.value}`
})

const clearSearchTimeout = (): void => {
  if (searchTimeout === null) return
  clearTimeout(searchTimeout)
  searchTimeout = null
}

const openSuggestionList = (): void => {
  isSuggestionListOpen.value = true
  highlightedSuggestionIndex.value = -1
}

const closeSuggestionList = (): void => {
  isSuggestionListOpen.value = false
  highlightedSuggestionIndex.value = -1
}

const highlightNextSuggestion = (): void => {
  if (!hasVisibleSuggestions.value) return
  highlightedSuggestionIndex.value =
    (highlightedSuggestionIndex.value + 1) % suggestions.value.length
}

const highlightPreviousSuggestion = (): void => {
  if (!hasVisibleSuggestions.value) return
  highlightedSuggestionIndex.value =
    highlightedSuggestionIndex.value <= 0
      ? suggestions.value.length - 1
      : highlightedSuggestionIndex.value - 1
}

const suggestionImageUrl = (suggestion: ProductSearchSuggestion): string | null =>
  suggestion.storagePath
    ? getImageUrl(ImageBucket.Product, suggestion.storagePath, ImageSize.Thumbnail)
    : null

const selectSuggestion = async (suggestion: ProductSearchSuggestion): Promise<void> => {
  if (suggestion.unavailableReason) return

  searchError.value = null
  selecting.value = true
  try {
    await props.select(suggestion.id)
    term.value = ''
    suggestions.value = []
    closeSuggestionList()
  } catch (err) {
    searchError.value = toErrorMessage(err)
  } finally {
    selecting.value = false
  }
}

const selectHighlightedSuggestion = (event: KeyboardEvent): void => {
  const highlightedSuggestion = suggestions.value[highlightedSuggestionIndex.value]
  if (!highlightedSuggestion) return
  event.preventDefault()
  void selectSuggestion(highlightedSuggestion)
}

watch(term, (nextTerm) => {
  clearSearchTimeout()
  searchError.value = null

  if (!nextTerm.trim()) {
    searchLoading.value = false
    suggestions.value = []
    highlightedSuggestionIndex.value = -1
    return
  }

  searchLoading.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const matches = await props.search(nextTerm)
      if (term.value === nextTerm) {
        suggestions.value = matches
        highlightedSuggestionIndex.value =
          matches.length > 0 && highlightedSuggestionIndex.value >= matches.length ? 0 : -1
      }
    } catch (err) {
      if (term.value === nextTerm) {
        suggestions.value = []
        highlightedSuggestionIndex.value = -1
        searchError.value = toErrorMessage(err)
      }
    } finally {
      if (term.value === nextTerm) {
        searchLoading.value = false
      }
    }
  }, SEARCH_DEBOUNCE_MILLISECONDS)
})

onUnmounted(clearSearchTimeout)
</script>

<template>
  <div class="space-y-2">
    <div class="relative">
      <TextInput
        :id="searchInputId"
        v-model="term"
        type="text"
        role="combobox"
        aria-haspopup="listbox"
        :aria-expanded="hasVisibleSuggestions"
        :aria-controls="hasVisibleSuggestions ? suggestionListId : undefined"
        :aria-activedescendant="activeDescendantId"
        placeholder="Produkt suchen"
        @focus="openSuggestionList"
        @input="openSuggestionList"
        @blur="closeSuggestionList"
        @keydown.down.prevent="highlightNextSuggestion"
        @keydown.up.prevent="highlightPreviousSuggestion"
        @keydown.enter="selectHighlightedSuggestion"
        @keydown.esc="closeSuggestionList"
      />
      <ul
        v-if="hasVisibleSuggestions"
        :id="suggestionListId"
        role="listbox"
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
      >
        <li
          v-for="(suggestion, index) in suggestions"
          :id="`${suggestionListId}-option-${index}`"
          :key="suggestion.id"
          role="option"
          :aria-selected="index === highlightedSuggestionIndex"
          :aria-disabled="suggestion.unavailableReason ? true : undefined"
          :class="index === highlightedSuggestionIndex ? 'bg-gray-50' : ''"
        >
          <Button
            :ariaLabel="suggestion.name"
            :variant="ButtonVariant.Row"
            :disabled="selecting || Boolean(suggestion.unavailableReason)"
            @mousedown.prevent="selectSuggestion(suggestion)"
          >
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50">
              <Image
                v-if="suggestionImageUrl(suggestion)"
                :src="suggestionImageUrl(suggestion) ?? ''"
                :alt="suggestion.name"
              />
              <div v-else class="flex h-full w-full items-center justify-center">
                <AppLogo class="h-5 w-5 text-gray-200" />
              </div>
            </div>
            <div class="min-w-0">
              <p class="truncate font-medium text-gray-800">{{ suggestion.name }}</p>
              <p v-if="suggestion.brand" class="truncate text-xs text-gray-400">
                {{ suggestion.brand }}
              </p>
              <p v-if="suggestion.unavailableReason" class="text-xs text-gray-500">
                {{ suggestion.unavailableReason }}
              </p>
            </div>
          </Button>
        </li>
      </ul>
    </div>

    <p v-if="searchLoading" class="text-xs text-gray-400">Suche läuft …</p>
    <p v-else-if="term.trim().length > 0 && !suggestions.length" class="text-xs text-gray-400">
      Keine passenden Produkte gefunden.
    </p>
    <p v-if="searchError" role="alert" class="text-xs text-red-600">{{ searchError }}</p>
  </div>
</template>
