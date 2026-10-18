<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAsyncData } from '@/composables/useAsyncData'
import { injectGateway } from '@/composables/injectGateway'
import { productDetailGatewayKey } from '@/services/ProductDetailGateway'
import { toErrorMessage } from '@/lib/error'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import NotFoundMessage from '@/components/NotFoundMessage.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import SimilarProductsSection from '@/components/SimilarProductsSection.vue'
import PriceReportsSection from '@/components/product/PriceReportsSection.vue'
import ProductActions from '@/components/product/ProductActions.vue'
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

    <div v-else-if="product" class="flex flex-col gap-4">
      <header class="flex flex-col gap-4">
        <ProductImageGallery :images="product.images" :product-name="product.name" />
        <ProductHeading :product="product" />
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
          :is-admin="authStore.isAdmin"
        />
        <ProductActions
          :product-id="product.id"
          :is-logged-in="authStore.isLoggedIn"
          :can-manage="canManageProduct"
          :error-message="deleteErrorMessage"
          @delete="deleteProduct(product.id)"
        />
      </section>
      <section class="flex flex-col gap-4">
        <SectionHeading>Produktinfos</SectionHeading>
        <SimilarProductsSection :product-id="product.id" :product-category="product.category" />
        <PriceReportsSection
          :product-id="product.id"
          :initial-reports="product.priceReports"
          :current-user-id="currentUserId"
        />
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
