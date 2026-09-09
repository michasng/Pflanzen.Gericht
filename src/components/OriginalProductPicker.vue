<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { searchOriginalProductCandidates, type OriginalProductCandidate } from '@/services/products'
import { getImageUrl } from '@/services/catalog'

const props = defineProps<{
  productId: string
  category: string
  modelValue: OriginalProductCandidate | null
}>()

const emit = defineEmits<{
  'update:modelValue': [product: OriginalProductCandidate | null]
}>()

const MIN_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 400
const SEARCH_ERROR_MESSAGE = 'Originale konnten nicht geladen werden.'

const query = ref('')
const results = ref<OriginalProductCandidate[]>([])
const searchError = ref<string | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | undefined
let latestSearchId = 0

const search = async (value: string, searchId: number): Promise<void> => {
  try {
    const nextResults = await searchOriginalProductCandidates(
      value,
      props.category,
      props.productId,
    )
    if (searchId !== latestSearchId) return
    results.value = nextResults
  } catch {
    if (searchId !== latestSearchId) return
    results.value = []
    searchError.value = SEARCH_ERROR_MESSAGE
  }
}

watch(query, (value) => {
  clearTimeout(searchTimer)
  const trimmedValue = value.trim()
  latestSearchId += 1
  searchError.value = null
  if (trimmedValue.length < MIN_QUERY_LENGTH) {
    results.value = []
    return
  }
  const searchId = latestSearchId
  searchTimer = setTimeout(() => {
    void search(trimmedValue, searchId)
  }, SEARCH_DEBOUNCE_MS)
})

const select = (product: OriginalProductCandidate): void => {
  query.value = ''
  results.value = []
  searchError.value = null
  emit('update:modelValue', product)
}

const clear = (): void => {
  searchError.value = null
  emit('update:modelValue', null)
}

onBeforeUnmount(() => {
  clearTimeout(searchTimer)
})
</script>

<template>
  <div>
    <div v-if="modelValue" class="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
      <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        <img
          v-if="modelValue.image"
          :src="getImageUrl('product-images', modelValue.image.storage_path)"
          alt=""
          class="w-full h-full object-cover"
        />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-gray-900 truncate">{{ modelValue.name }}</p>
        <p v-if="modelValue.brand" class="text-xs text-gray-500 truncate">
          {{ modelValue.brand }}
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 text-xs text-red-500 hover:text-red-700 transition-colors"
        @click="clear"
      >
        Entfernen
      </button>
    </div>
    <div v-else class="relative">
      <input
        v-model="query"
        type="text"
        placeholder="Original suchen …"
        class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <ul
        v-if="results.length"
        class="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
      >
        <li v-for="candidate in results" :key="candidate.id">
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            @mousedown.prevent="select(candidate)"
          >
            <div class="w-8 h-8 rounded overflow-hidden bg-gray-100 shrink-0">
              <img
                v-if="candidate.image"
                :src="getImageUrl('product-images', candidate.image.storage_path)"
                alt=""
                class="w-full h-full object-cover"
              />
            </div>
            <span class="truncate">
              {{ candidate.name }}
              <span v-if="candidate.brand" class="text-gray-400">· {{ candidate.brand }}</span>
            </span>
          </button>
        </li>
      </ul>
      <p v-if="searchError" class="mt-2 text-xs text-red-500">{{ searchError }}</p>
    </div>
  </div>
</template>
