<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAsyncData } from '@/composables/useAsyncData'
import { useProductDetailGateway } from '@/composables/useProductDetailGateway'
import { toErrorMessage } from '@/lib/error'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import NotFoundMessage from '@/components/NotFoundMessage.vue'
import SimilarProductsSection from '@/components/SimilarProductsSection.vue'
import PriceReportsSection from '@/components/product/PriceReportsSection.vue'
import ProductActions from '@/components/product/ProductActions.vue'
import ProductHeading from '@/components/product/ProductHeading.vue'
import ProductImageGallery from '@/components/product/ProductImageGallery.vue'
import ProductIngredients from '@/components/product/ProductIngredients.vue'
import ProductNutritionTable from '@/components/product/ProductNutritionTable.vue'
import ProductRatingSummary from '@/components/product/ProductRatingSummary.vue'
import ProductReviewsSection from '@/components/product/ProductReviewsSection.vue'
import ProductSources from '@/components/product/ProductSources.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const productDetailGateway = useProductDetailGateway()

const {
  data: product,
  loading,
  errorMessage,
  notFound,
} = useAsyncData(
  (productId: string) => productDetailGateway.fetchProductDetail(productId),
  () => String(route.params.id),
)

const currentUserId = computed(() => authStore.user?.id ?? null)
const canManageProduct = computed(
  () =>
    authStore.isLoggedIn && (product.value?.createdBy === currentUserId.value || authStore.isAdmin),
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
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <LoadingText v-if="loading" />
    <NotFoundMessage v-else-if="notFound" message="Produkt nicht gefunden." />
    <AlertMessage v-else-if="errorMessage" :message="errorMessage" />

    <template v-else-if="product">
      <ProductImageGallery :images="product.images" :product-name="product.name" />
      <ProductHeading :product="product" />
      <ProductIngredients :ingredients="product.ingredients" />
      <ProductNutritionTable :energy-joules="product.energyJoules" :nutrients="product.nutrients" />
      <ProductSources :sources="product.sources" />
      <ProductRatingSummary
        :average-overall="product.avgOverall"
        :reviews-count="product.reviewsCount"
        :reviews="product.reviews"
      />
      <SimilarProductsSection :product-id="product.id" :product-category="product.category" />
      <PriceReportsSection
        :product-id="product.id"
        :initial-reports="product.priceReports"
        :current-user-id="currentUserId"
      />
      <ProductActions
        :product-id="product.id"
        :is-logged-in="authStore.isLoggedIn"
        :can-manage="canManageProduct"
        :error-message="deleteErrorMessage"
        @delete="deleteProduct(product.id)"
      />
      <ProductReviewsSection
        :reviews="product.reviews"
        :current-user-id="currentUserId"
        :is-admin="authStore.isAdmin"
      />

      <p v-if="product.barcode" class="mt-6 text-center text-xs text-gray-500">
        Barcode: {{ product.barcode }}
      </p>
    </template>
  </div>
</template>
