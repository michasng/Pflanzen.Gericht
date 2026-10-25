<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import ProductSearch from '@/components/ProductSearch.vue'
import SimilarProductCard from '@/components/SimilarProductCard.vue'
import SimilarProductDialog from '@/components/SimilarProductDialog.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import Grid from '@/components/primitives/GridComponent.vue'
import { injectGateway } from '@/composables/injectGateway'
import type { SimilarityCandidate, SimilarProduct } from '@/services/similarProducts'
import { similarProductsGatewayKey } from '@/services/SimilarProductsGateway'
import { toErrorMessage } from '@/lib/error'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ productId: string; productCategory: string }>()

const {
  adminRemoveSimilarity,
  fetchSimilarProducts,
  removeSimilarityVote,
  searchSimilarityCandidates,
  voteSimilarity,
} = injectGateway(similarProductsGatewayKey)

const authStore = useAuthStore()
const route = useRoute()

const similarProducts = ref<SimilarProduct[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showSuggestionSearch = ref(false)
const activeSimilarProductId = ref<string | null>(null)
const dialogError = ref<string | null>(null)
const actionPending = ref(false)

const activeSimilarProduct = computed(
  () =>
    similarProducts.value.find((product) => product.id === activeSimilarProductId.value) ?? null,
)

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

  await voteSimilarity(props.productId, candidateId, true, user.id)
  await reloadSimilarProducts()
  showSuggestionSearch.value = false
}

const searchCandidates = (term: string): Promise<SimilarityCandidate[]> =>
  searchSimilarityCandidates({ id: props.productId, category: props.productCategory }, term)

const handleVote = async (agreed: boolean): Promise<void> => {
  const user = authStore.user
  const similarProduct = activeSimilarProduct.value
  if (!user || !similarProduct) return

  dialogError.value = null
  actionPending.value = true
  try {
    if (similarProduct.myVote === agreed) {
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

watch(
  () => props.productId,
  async () => {
    loading.value = true
    error.value = null
    dialogError.value = null
    similarProducts.value = []
    showSuggestionSearch.value = false
    activeSimilarProductId.value = null
    try {
      await loadSimilarProducts()
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="rounded-2xl border border-gray-100 bg-white p-4">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h3 class="text-base font-bold text-gray-900">
        Ähnliche Produkte
        <span v-if="similarProducts.length" class="text-sm font-normal text-gray-400">
          ({{ similarProducts.length }})
        </span>
      </h3>
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
      <ProductSearch
        v-if="showSuggestionSearch"
        :search="searchCandidates"
        :select="selectCandidate"
      />

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

      <Grid v-else-if="similarProducts.length" class="transition-opacity duration-150">
        <SimilarProductCard
          v-for="similarProduct in similarProducts"
          :key="similarProduct.id"
          :product="similarProduct"
          @select="activeSimilarProductId = similarProduct.id"
        />
      </Grid>
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
