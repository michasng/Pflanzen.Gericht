<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAsyncData } from '@/composables/useAsyncData'
import { injectGateway } from '@/composables/injectGateway'
import { provideProductBookmarks } from '@/composables/provideProductBookmarks'
import { productDetailGatewayKey } from '@/services/ProductDetailGateway'
import { toErrorMessage } from '@/lib/error'
import AlertMessage from '@/components/AlertMessage.vue'
import ConfettiBurst from '@/components/ConfettiBurst.vue'
import { CELEBRATION_QUERY_KEY } from '@/lib/celebrationQueryKey'
import LoadingText from '@/components/LoadingText.vue'
import NotFoundMessage from '@/components/NotFoundMessage.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import SimilarProductsSection from '@/components/SimilarProductsSection.vue'
import PriceReportsSection from '@/components/product/PriceReportsSection.vue'
import ProductActions from '@/components/product/ProductActions.vue'
import ProductBookmarkControl from '@/components/product/ProductBookmarkControl.vue'
import ProductFooter from '@/components/product/ProductFooter.vue'
import ProductHeading from '@/components/product/ProductHeading.vue'
import ProductImageGallery from '@/components/product/ProductImageGallery.vue'
import ProductIngredients from '@/components/product/ProductIngredients.vue'
import ProductNutritionTable from '@/components/product/ProductNutritionTable.vue'
import ProductRatingSummary from '@/components/product/ProductRatingSummary.vue'
import ProductReviewsSection from '@/components/product/ProductReviewsSection.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const productDetailGateway = injectGateway(productDetailGatewayKey)

const isCelebrating = route.query[CELEBRATION_QUERY_KEY] !== undefined
if (isCelebrating) {
  const remainingQuery = { ...route.query }
  delete remainingQuery[CELEBRATION_QUERY_KEY]
  void router.replace({ query: remainingQuery })
}

const {
  data: product,
  loading,
  errorMessage,
  notFound,
  reload,
} = useAsyncData(
  (productId: string) => productDetailGateway.fetchProductDetail(productId),
  () => String(route.params.id),
)

const currentUserId = computed(() => authStore.user?.id ?? null)
const currentUserProfile = computed(() =>
  authStore.profile
    ? { username: authStore.profile.username, displayName: authStore.profile.displayName }
    : null,
)
provideProductBookmarks(() => (product.value ? [product.value.id] : []))
const canManageProduct = computed(
  () =>
    authStore.isLoggedIn && (product.value?.createdBy === currentUserId.value || authStore.isAdmin),
)

const hasReviewedProduct = computed(
  () =>
    currentUserId.value !== null &&
    (product.value?.reviews.some((review) => review.userId === currentUserId.value) ?? false),
)

const deleteErrorMessage = ref<string | null>(null)

const deleteProduct = async (productId: string): Promise<void> => {
  if (!confirm('Produkt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'))
    return

  deleteErrorMessage.value = null
  try {
    await productDetailGateway.deleteProduct(productId)
    await router.push({ name: 'home' })
  } catch (err) {
    deleteErrorMessage.value = toErrorMessage(err)
  }
}

const deleteReview = async (reviewId: string): Promise<void> => {
  if (!confirm('Bewertung wirklich löschen?')) return

  deleteErrorMessage.value = null
  try {
    await productDetailGateway.deleteReview(reviewId)
  } catch (err) {
    deleteErrorMessage.value = toErrorMessage(err)
    return
  }
  await reload()
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <ConfettiBurst v-if="isCelebrating" />
    <LoadingText v-if="loading" />
    <NotFoundMessage v-else-if="notFound" message="Produkt nicht gefunden." />
    <AlertMessage v-else-if="errorMessage" :message="errorMessage" />

    <div v-else-if="product" class="flex flex-col gap-4">
      <header class="flex flex-col gap-4">
        <ProductImageGallery :images="product.images" :product-name="product.name" />
        <ProductHeading :product="product">
          <template #actions>
            <ProductBookmarkControl :product-id="product.id" :current-user-id="currentUserId" />
          </template>
        </ProductHeading>
      </header>
      <ProductRatingSummary
        :average-overall="product.avgOverall"
        :reviews-count="product.reviewsCount"
        :reviews="product.reviews"
      />
      <section class="flex flex-col gap-4">
        <SectionHeading>Bewertungen</SectionHeading>
        <ProductReviewsSection
          :reviews="product.reviews"
          :current-user-id="currentUserId"
          :current-user-profile="currentUserProfile"
          :is-admin="authStore.isAdmin"
          @delete="deleteReview"
        />
        <ProductActions
          :product-id="product.id"
          :is-logged-in="authStore.isLoggedIn"
          :has-reviewed="hasReviewedProduct"
          :can-manage="canManageProduct"
          :error-message="deleteErrorMessage"
          @delete="deleteProduct(product.id)"
        />
      </section>
      <SimilarProductsSection :product-id="product.id" :product-category="product.category" />
      <PriceReportsSection
        :product-id="product.id"
        :initial-reports="product.priceReports"
        :current-user-id="currentUserId"
      />
      <section class="flex flex-col gap-4">
        <SectionHeading>Produktinfos</SectionHeading>
        <p v-if="product.description" class="text-sm text-gray-600">{{ product.description }}</p>
        <ProductIngredients :ingredients="product.ingredients" />
        <ProductNutritionTable
          :energy-joules="product.energyJoules"
          :nutrients="product.nutrients"
        />
      </section>
      <ProductFooter :sources="product.sources" :barcode="product.barcode" />
    </div>
  </div>
</template>
