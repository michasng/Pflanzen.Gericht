<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchAllProductsForAdmin,
  deleteProduct,
  ADMIN_PAGE_SIZE as PRODUCT_PAGE_SIZE,
} from '@/services/products'
import {
  fetchAllReviewsForAdmin,
  type AdminReviewItem,
  ADMIN_PAGE_SIZE as REVIEW_PAGE_SIZE,
} from '@/services/reviews'
import { deleteReview } from '@/services/profile'
import { toErrorMessage } from '@/lib/error'
import { categoryToLabel } from '@/config/categories'
import type { ProductListItem } from '@/services/catalog'
import StarDisplay from '@/components/StarDisplay.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'
import TabButton from '@/components/primitives/TabButton.vue'
import Card from '@/components/primitives/CardComponent.vue'
import Chip from '@/components/primitives/ChipComponent.vue'
import { ChipSize } from '@/components/primitives/ChipSize'
import { ChipTone } from '@/components/primitives/ChipTone'
import { formatDate } from '@/lib/date'
import { orderProductPairByCreation } from '@/lib/orderProductPairByCreation'

const router = useRouter()

const activeTab = ref<'products' | 'reviews'>('products')
const products = ref<ProductListItem[]>([])
const reviews = ref<AdminReviewItem[]>([])
const loading = ref(true)
const loadError = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const selectedProductIds = ref<string[]>([])
const productPage = ref(0)
const productHasMore = ref(true)
const reviewPage = ref(0)
const reviewHasMore = ref(true)
const loadingMore = ref(false)

onMounted(async () => {
  try {
    const [p, r] = await Promise.all([fetchAllProductsForAdmin(), fetchAllReviewsForAdmin()])
    products.value = p
    productHasMore.value = p.length === PRODUCT_PAGE_SIZE
    reviews.value = r
    reviewHasMore.value = r.length === REVIEW_PAGE_SIZE
  } catch (err) {
    loadError.value = toErrorMessage(err)
  } finally {
    loading.value = false
  }
})

const loadMoreProducts = async (): Promise<void> => {
  loadingMore.value = true
  try {
    productPage.value++
    const more = await fetchAllProductsForAdmin(productPage.value)
    products.value.push(...more)
    productHasMore.value = more.length === PRODUCT_PAGE_SIZE
  } catch (err) {
    alert(toErrorMessage(err))
  } finally {
    loadingMore.value = false
  }
}

const loadMoreReviews = async (): Promise<void> => {
  loadingMore.value = true
  try {
    reviewPage.value++
    const more = await fetchAllReviewsForAdmin(reviewPage.value)
    reviews.value.push(...more)
    reviewHasMore.value = more.length === REVIEW_PAGE_SIZE
  } catch (err) {
    alert(toErrorMessage(err))
  } finally {
    loadingMore.value = false
  }
}

const removeProduct = async (id: string): Promise<void> => {
  deletingId.value = id
  try {
    await deleteProduct(id)
    products.value = products.value.filter((p) => p.id !== id)
    selectedProductIds.value = selectedProductIds.value.filter((selectedId) => selectedId !== id)
  } catch (err) {
    alert(toErrorMessage(err))
  } finally {
    deletingId.value = null
  }
}

const handleDeleteProduct = async (id: string): Promise<void> => {
  if (!confirm('Produkt und alle zugehörigen Bewertungen unwiderruflich löschen?')) return
  await removeProduct(id)
}

const handleDeleteSelectedProducts = async (): Promise<void> => {
  if (!confirm('Ausgewählte Produkte und alle zugehörigen Bewertungen unwiderruflich löschen?'))
    return
  for (const id of selectedProductIds.value) {
    await removeProduct(id)
  }
}

const handleMergeProducts = async (): Promise<void> => {
  const selected = products.value.filter((p) => selectedProductIds.value.includes(p.id))
  const [first, second] = selected
  if (!first || !second || selectedProductIds.value.length !== 2) return
  const [a, b] = orderProductPairByCreation(first, second)
  await router.push({ name: 'product-merge', query: { a: a.id, b: b.id } })
}

const handleDeleteReview = async (id: string): Promise<void> => {
  if (!confirm('Bewertung unwiderruflich löschen?')) return
  deletingId.value = id
  try {
    await deleteReview(id)
    reviews.value = reviews.value.filter((r) => r.id !== id)
  } catch (err) {
    alert(toErrorMessage(err))
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-xl font-bold text-gray-900 mb-4">Administration</h1>

    <LoadingText v-if="loading" />
    <AlertMessage v-else-if="loadError" :message="loadError" />

    <template v-else>
      <div role="tablist" class="flex border-b border-gray-200 mb-4">
        <TabButton
          ariaLabel="Produkte"
          :active="activeTab === 'products'"
          @click="activeTab = 'products'"
        >
          Produkte ({{ products.length }})
        </TabButton>
        <TabButton
          ariaLabel="Bewertungen"
          :active="activeTab === 'reviews'"
          @click="activeTab = 'reviews'"
        >
          Bewertungen ({{ reviews.length }})
        </TabButton>
      </div>

      <template v-if="activeTab === 'products'">
        <p v-if="products.length === 0" class="py-12 text-center text-gray-400 text-sm">
          Keine Produkte vorhanden.
        </p>
        <div v-else class="mb-3 flex justify-end gap-2">
          <Button
            ariaLabel="Produkte zusammenführen"
            :variant="ButtonVariant.Outlined"
            :size="ButtonSize.Compact"
            :disabled="selectedProductIds.length !== 2"
            @click="handleMergeProducts"
          >
            Zusammenführen
          </Button>
          <Button
            ariaLabel="Ausgewählte Produkte löschen"
            :variant="ButtonVariant.Outlined"
            :size="ButtonSize.Compact"
            :tone="ButtonTone.Danger"
            :disabled="selectedProductIds.length === 0 || deletingId !== null"
            @click="handleDeleteSelectedProducts"
          >
            Löschen
          </Button>
        </div>
        <ul v-if="products.length" class="space-y-2">
          <li v-for="product in products" :key="product.id">
            <Card>
              <div class="flex items-start justify-between gap-2">
                <input
                  v-model="selectedProductIds"
                  type="checkbox"
                  :value="product.id"
                  :aria-label="`${product.name} auswählen`"
                  class="mt-1 h-4 w-4 shrink-0 rounded"
                />
                <div class="min-w-0 flex-1">
                  <RouterLink
                    :to="{ name: 'product-detail', params: { id: product.id } }"
                    class="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    {{ product.name }}
                  </RouterLink>
                  <p class="text-sm text-gray-500 mt-0.5">
                    {{ categoryToLabel(product.category) }}
                    <span v-if="product.brand"> · {{ product.brand }}</span>
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ product.reviewsCount }} Bewertungen · {{ formatDate(product.createdAt) }}
                  </p>
                </div>
                <div class="flex gap-2 shrink-0">
                  <RouterLink
                    :to="{ name: 'product-edit', params: { id: product.id } }"
                    class="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
                  >
                    Bearbeiten
                  </RouterLink>
                  <Button
                    ariaLabel="Produkt löschen"
                    :variant="ButtonVariant.Text"
                    :size="ButtonSize.Small"
                    :tone="ButtonTone.Danger"
                    :disabled="deletingId === product.id"
                    @click="handleDeleteProduct(product.id)"
                  >
                    {{ deletingId === product.id ? 'Löscht …' : 'Löschen' }}
                  </Button>
                </div>
              </div>
            </Card>
          </li>
        </ul>
        <div v-if="productHasMore" class="mt-4 text-center">
          <Button
            ariaLabel="Mehr Produkte laden"
            :variant="ButtonVariant.Outlined"
            :size="ButtonSize.Comfortable"
            :disabled="loadingMore"
            @click="loadMoreProducts"
          >
            {{ loadingMore ? 'Lädt …' : 'Mehr laden' }}
          </Button>
        </div>
      </template>

      <template v-else>
        <p v-if="reviews.length === 0" class="py-12 text-center text-gray-400 text-sm">
          Keine Bewertungen vorhanden.
        </p>
        <ul v-else class="space-y-2">
          <li v-for="review in reviews" :key="review.id">
            <Card>
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <RouterLink
                    :to="{ name: 'product-detail', params: { id: review.product.id } }"
                    class="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    {{ review.product.name }}
                  </RouterLink>
                  <p class="text-sm text-gray-500 mt-0.5">
                    von
                    <RouterLink
                      :to="{ name: 'profile-public', params: { id: review.userId } }"
                      class="hover:text-primary-600 transition-colors"
                    >
                      {{ review.profile.username }}
                    </RouterLink>
                    <Chip
                      v-if="!review.isCurrent"
                      class="ml-2"
                      :size="ChipSize.Tight"
                      :tone="ChipTone.Muted"
                    >
                      Veraltet
                    </Chip>
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <StarDisplay :value="review.overall" />
                    <span class="text-xs text-gray-400">{{ formatDate(review.createdAt) }}</span>
                  </div>
                </div>
                <div class="flex gap-2 shrink-0">
                  <RouterLink
                    :to="{ name: 'review-edit', params: { reviewId: review.id } }"
                    class="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
                  >
                    Bearbeiten
                  </RouterLink>
                  <Button
                    ariaLabel="Bewertung löschen"
                    :variant="ButtonVariant.Text"
                    :size="ButtonSize.Small"
                    :tone="ButtonTone.Danger"
                    :disabled="deletingId === review.id"
                    @click="handleDeleteReview(review.id)"
                  >
                    {{ deletingId === review.id ? 'Löscht …' : 'Löschen' }}
                  </Button>
                </div>
              </div>
            </Card>
          </li>
        </ul>
        <div v-if="reviewHasMore" class="mt-4 text-center">
          <Button
            ariaLabel="Mehr Bewertungen laden"
            :variant="ButtonVariant.Outlined"
            :size="ButtonSize.Comfortable"
            :disabled="loadingMore"
            @click="loadMoreReviews"
          >
            {{ loadingMore ? 'Lädt …' : 'Mehr laden' }}
          </Button>
        </div>
      </template>
    </template>
  </div>
</template>
