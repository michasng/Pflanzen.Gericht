<script setup lang="ts">
// Chromium-based mobile browsers (e.g. Chrome/Brave on Android) don't show the
// suggestion popup for <input list="..."> + <datalist>, a long-standing Chromium bug:
// https://issues.chromium.org/issues/41451180
// This component works around that by rendering the suggestion list itself.
import { computed, useId } from 'vue'
import { useSuggestionFilter } from '@/composables/useSuggestionFilter'

const props = defineProps<{
  modelValue: string
  suggestions: readonly string[]
  id?: string
  placeholder?: string
  maxlength?: number
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  enter: []
}>()

const generatedInputId = useId()
const inputId = computed(() => props.id ?? generatedInputId)
const listboxId = useId()
const optionId = (index: number): string => `${listboxId}-option-${index}`

const query = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const suggestions = computed(() => props.suggestions)

const {
  isOpen,
  highlightedIndex,
  filteredSuggestions,
  open,
  close,
  highlightNext,
  highlightPrevious,
  pickHighlighted,
} = useSuggestionFilter(suggestions, query)

const hasVisibleSuggestions = computed(() => isOpen.value && filteredSuggestions.value.length > 0)

const activeDescendantId = computed(() => {
  if (!hasVisibleSuggestions.value) return undefined
  if (highlightedIndex.value < 0 || highlightedIndex.value >= filteredSuggestions.value.length) {
    return undefined
  }
  return optionId(highlightedIndex.value)
})

const pick = (suggestion: string): void => {
  query.value = suggestion
  close()
}

const handleEnter = (event: KeyboardEvent): void => {
  const highlighted = pickHighlighted()
  if (!highlighted) {
    emit('enter')
    return
  }
  event.preventDefault()
  pick(highlighted)
}
</script>

<template>
  <div class="relative">
    <input
      :id="inputId"
      v-model="query"
      type="text"
      autocomplete="off"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="hasVisibleSuggestions ? listboxId : undefined"
      :aria-activedescendant="activeDescendantId"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :required="required"
      class="w-full min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      @focus="open"
      @blur="close"
      @keydown.down.prevent="highlightNext"
      @keydown.up.prevent="highlightPrevious"
      @keydown.enter="handleEnter"
      @keydown.esc="close"
    />
    <ul
      v-if="hasVisibleSuggestions"
      :id="listboxId"
      role="listbox"
      class="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <li
        v-for="(suggestion, index) in filteredSuggestions"
        :id="optionId(index)"
        :key="suggestion"
        role="option"
        :aria-selected="index === highlightedIndex"
      >
        <button
          type="button"
          tabindex="-1"
          class="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
          :class="index === highlightedIndex ? 'bg-gray-50' : ''"
          @mousedown.prevent="pick(suggestion)"
        >
          {{ suggestion }}
        </button>
      </li>
    </ul>
  </div>
</template>
