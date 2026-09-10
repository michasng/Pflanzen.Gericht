<script setup lang="ts">
import { computed, onUnmounted, ref, useId, watch } from 'vue'
import { useRoute } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import AppLogo from '@/components/AppLogo.vue'
import SimilarProductCard from '@/components/SimilarProductCard.vue'
import SimilarProductDialog from '@/components/SimilarProductDialog.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import GridComponent from '@/components/primitives/GridComponent.vue'
import { getImageUrl } from '@/services/catalog'
import {
  adminRemoveSimilarity,
  fetchSimilarProducts,
  removeSimilarityVote,
  searchSimilarityCandidates,
  type SimilarityCandidate,
  type SimilarProduct,
  voteSimilarity,
} from '@/services/similarProducts'
import { toErrorMessage } from '@/lib/error'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ productId: string }>()

const authStore = useAuthStore()
const route = useRoute()

const similarProducts = ref<SimilarProduct[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showSuggestionSearch = ref(false)
const search = ref('')
const searchLoading = ref(false)
const searchError = ref<string | null>(null)
const suggestions = ref<SimilarityCandidate[]>([])
const isSuggestionListOpen = ref(false)
const highlightedSuggestionIndex = ref(-1)
const activeSimilarProductId = ref<string | null>(null)
const dialogError = ref<string | null>(null)
const actionPending = ref(false)

let searchTimeout: ReturnType<typeof setTimeout> | null = null
const suggestionListId = useId()

const activeSimilarProduct = computed(
  () =>
    similarProducts.value.find((product) => product.id === activeSimilarProductId.value) ?? null,
)
const hasVisibleSuggestions = computed(
  () =>
    isSuggestionListOpen.value && search.value.trim().length > 0 && suggestions.value.length > 0,
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

const loadSimilarProducts = async (): Promise<void> => {
  try {
    similarProducts.value = await fetchSimilarProducts(props.productId)
    if (
      activeSimilarProductId.value &&
      !similarProducts.value.some((product) => product.id === activeSimilarProductId.value)
    ) {
      activeSimilarProductId.value = null
    }
  } catch (err) {
    error.value = toErrorMessage(err)
  }
}

const reloadSimilarProducts = async (): Promise<void> => {
  error.value = null
  await loadSimilarProducts()
}

const selectCandidate = async (candidateId: string): Promise<void> => {
  const user = authStore.user
  if (!user) return

  searchError.value = null
  actionPending.value = true
  try {
    await voteSimilarity(props.productId, candidateId, true, user.id)
    await reloadSimilarProducts()
    search.value = ''
    suggestions.value = []
    showSuggestionSearch.value = false
    closeSuggestionList()
  } catch (err) {
    searchError.value = toErrorMessage(err)
  } finally {
    actionPending.value = false
  }
}

const handleVote = async (agreed: boolean): Promise<void> => {
  const user = authStore.user
  const similarProduct = activeSimilarProduct.value
  if (!user || !similarProduct) return

  dialogError.value = null
  actionPending.value = true
  try {
    if (similarProduct.my_vote === agreed) {
      await removeSimilarityVote(props.productId, similarProduct.id, user.id)
    } else {
      await voteSimilarity(props.productId, similarProduct.id, agreed, user.id)
    }
    await reloadSimilarProducts()
  } catch (err) {
    dialogError.value = toErrorMessage(err)
  } finally {
    actionPending.value = false
  }
}

const handleAdminRemove = async (): Promise<void> => {
  const similarProduct = activeSimilarProduct.value
  if (!similarProduct) return

  dialogError.value = null
  actionPending.value = true
  try {
    await adminRemoveSimilarity(props.productId, similarProduct.id)
    await reloadSimilarProducts()
    activeSimilarProductId.value = null
  } catch (err) {
    dialogError.value = toErrorMessage(err)
  } finally {
    actionPending.value = false
  }
}

const suggestionImageUrl = (candidate: SimilarityCandidate): string | null =>
  candidate.storage_path ? getImageUrl('product-images', candidate.storage_path) : null

const selectHighlightedSuggestion = (event: KeyboardEvent): void => {
  const highlightedSuggestion = suggestions.value[highlightedSuggestionIndex.value]
  if (!highlightedSuggestion) return
  event.preventDefault()
  void selectCandidate(highlightedSuggestion.id)
}

watch(
  () => props.productId,
  async () => {
    loading.value = true
    error.value = null
    dialogError.value = null
    similarProducts.value = []
    showSuggestionSearch.value = false
    search.value = ''
    suggestions.value = []
    activeSimilarProductId.value = null
    clearSearchTimeout()
    closeSuggestionList()
    try {
      await loadSimilarProducts()
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

watch(search, (nextSearch) => {
  clearSearchTimeout()
  searchError.value = null

  if (!showSuggestionSearch.value || !nextSearch.trim()) {
    searchLoading.value = false
    suggestions.value = []
    highlightedSuggestionIndex.value = -1
    return
  }

  searchLoading.value = true
  const currentSearch = nextSearch
  searchTimeout = setTimeout(async () => {
    try {
      const matches = await searchSimilarityCandidates(props.productId, currentSearch)
      if (search.value === currentSearch) {
        suggestions.value = matches
        highlightedSuggestionIndex.value =
          matches.length > 0 && highlightedSuggestionIndex.value >= matches.length ? 0 : -1
      }
    } catch (err) {
      if (search.value === currentSearch) {
        suggestions.value = []
        highlightedSuggestionIndex.value = -1
        searchError.value = toErrorMessage(err)
      }
    } finally {
      if (search.value === currentSearch) {
        searchLoading.value = false
      }
    }
  }, 250)
})

onUnmounted(() => {
  clearSearchTimeout()
})
</script>

<template>
  <div class="mb-4 rounded-2xl border border-gray-100 bg-white p-4">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h2 class="text-base font-bold text-gray-900">
        Ähnliche Produkte
        <span v-if="similarProducts.length" class="text-sm font-normal text-gray-400">
          ({{ similarProducts.length }})
        </span>
      </h2>
      <Button
        v-if="authStore.isLoggedIn && !showSuggestionSearch"
        ariaLabel="Vorschlag hinzufügen"
        :variant="ButtonVariant.Text"
        :size="ButtonSize.Small"
        @click="showSuggestionSearch = true"
      >
        + Vorschlag hinzufügen
      </Button>
    </div>

    <AlertMessage v-if="error" :message="error" />

    <div v-else class="space-y-4">
      <div v-if="showSuggestionSearch" class="space-y-2">
        <div class="relative">
          <input
            v-model="search"
            type="text"
            role="combobox"
            aria-haspopup="listbox"
            :aria-expanded="hasVisibleSuggestions"
            :aria-controls="hasVisibleSuggestions ? suggestionListId : undefined"
            :aria-activedescendant="activeDescendantId"
            placeholder="Produkt suchen"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            @focus="openSuggestionList"
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
              v-for="(candidate, index) in suggestions"
              :id="`${suggestionListId}-option-${index}`"
              :key="candidate.id"
              role="option"
              :aria-selected="index === highlightedSuggestionIndex"
            >
              <button
                type="button"
                :aria-label="candidate.name"
                :disabled="actionPending"
                class="flex w-full items-center justify-start gap-3 px-3 py-2 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                :class="index === highlightedSuggestionIndex ? 'bg-gray-50' : ''"
                @mousedown.prevent="selectCandidate(candidate.id)"
              >
                <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                  <img
                    v-if="suggestionImageUrl(candidate)"
                    :src="suggestionImageUrl(candidate) ?? undefined"
                    :alt="candidate.name"
                    class="h-full w-full object-cover"
                  />
                  <div v-else class="flex h-full w-full items-center justify-center">
                    <AppLogo class="h-5 w-5 text-gray-200" />
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="truncate font-medium text-gray-800">{{ candidate.name }}</p>
                  <p v-if="candidate.brand" class="truncate text-xs text-gray-400">
                    {{ candidate.brand }}
                  </p>
                </div>
              </button>
            </li>
          </ul>
        </div>

        <p v-if="searchLoading" class="text-xs text-gray-400">Suche läuft …</p>
        <p
          v-else-if="search.trim().length > 0 && !suggestions.length"
          class="text-xs text-gray-400"
        >
          Keine passenden Produkte gefunden.
        </p>
        <p v-if="searchError" role="alert" class="text-xs text-red-600">{{ searchError }}</p>
      </div>

      <p v-if="loading" class="py-2 text-center text-sm text-gray-400">Wird geladen …</p>

      <p
        v-else-if="!similarProducts.length && !showSuggestionSearch"
        class="py-2 text-center text-sm text-gray-400"
      >
        Noch keine ähnlichen Produkte vorgeschlagen.
        <template v-if="!authStore.isLoggedIn">
          <RouterLink
            :to="{ name: 'login', query: { redirect: route.fullPath } }"
            class="text-primary-600 hover:underline"
          >
            Anmelden
          </RouterLink>
          zum Vorschlagen.
        </template>
      </p>

      <GridComponent v-else-if="similarProducts.length" class="transition-opacity duration-150">
        <SimilarProductCard
          v-for="similarProduct in similarProducts"
          :key="similarProduct.id"
          :product="similarProduct"
          @select="activeSimilarProductId = similarProduct.id"
        />
      </GridComponent>
    </div>

    <SimilarProductDialog
      :product="activeSimilarProduct"
      :is-busy="actionPending"
      :is-admin="authStore.isAdmin"
      :is-logged-in="authStore.isLoggedIn"
      :login-redirect-path="route.fullPath"
      :error-message="dialogError"
      @close="activeSimilarProductId = null"
      @vote="handleVote"
      @remove="handleAdminRemove"
    />
  </div>
</template>
