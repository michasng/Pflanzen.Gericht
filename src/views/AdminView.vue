<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminGateway } from '@/composables/useAdminGateway'
import type { ProductListItem } from '@/services/catalog'
import { orderProductPairByCreation } from '@/lib/orderProductPairByCreation'
import { usePaginatedList } from '@/composables/usePaginatedList'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import TabButton from '@/components/primitives/TabButton.vue'
import AdminProductList from '@/components/admin/AdminProductList.vue'
import AdminReviewList from '@/components/admin/AdminReviewList.vue'
import { AdminTab } from '@/components/admin/AdminTab'

const router = useRouter()
const adminGateway = useAdminGateway()

const activeTab = ref(AdminTab.Products)

const {
  items: products,
  loading: productsLoading,
  loadError: productsLoadError,
  hasMore: productsHaveMore,
  loadingMore: loadingMoreProducts,
  deletingId: deletingProductId,
  loadFirstPage: loadFirstProductPage,
  loadMore: loadMoreProducts,
  remove: removeProduct,
} = usePaginatedList({
  fetchPage: adminGateway.fetchProductsPage,
  pageSize: adminGateway.productPageSize,
  deleteItem: adminGateway.deleteProduct,
  reportError: (message) => alert(message),
})

const {
  items: reviews,
  loading: reviewsLoading,
  loadError: reviewsLoadError,
  hasMore: reviewsHaveMore,
  loadingMore: loadingMoreReviews,
  deletingId: deletingReviewId,
  loadFirstPage: loadFirstReviewPage,
  loadMore: loadMoreReviews,
  remove: removeReview,
} = usePaginatedList({
  fetchPage: adminGateway.fetchReviewsPage,
  pageSize: adminGateway.reviewPageSize,
  deleteItem: adminGateway.deleteReview,
  reportError: (message) => alert(message),
})

const loading = computed(() => productsLoading.value || reviewsLoading.value)
const loadError = computed(() => productsLoadError.value ?? reviewsLoadError.value)

void Promise.all([loadFirstProductPage(), loadFirstReviewPage()])

const handleDeleteProducts = async (ids: string[]): Promise<void> => {
  for (const id of ids) {
    await removeProduct(id)
  }
}

const handleMergeProducts = async (
  first: ProductListItem,
  second: ProductListItem,
): Promise<void> => {
  const [a, b] = orderProductPairByCreation(first, second)
  await router.push({ name: 'product-merge', query: { a: a.id, b: b.id } })
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
          :active="activeTab === AdminTab.Products"
          @click="activeTab = AdminTab.Products"
        >
          Produkte ({{ products.length }})
        </TabButton>
        <TabButton
          ariaLabel="Bewertungen"
          :active="activeTab === AdminTab.Reviews"
          @click="activeTab = AdminTab.Reviews"
        >
          Bewertungen ({{ reviews.length }})
        </TabButton>
      </div>

      <AdminProductList
        v-if="activeTab === AdminTab.Products"
        :products="products"
        :hasMore="productsHaveMore"
        :loadingMore="loadingMoreProducts"
        :deletingId="deletingProductId"
        @delete="handleDeleteProducts"
        @merge="handleMergeProducts"
        @loadMore="loadMoreProducts"
      />
      <AdminReviewList
        v-else
        :reviews="reviews"
        :hasMore="reviewsHaveMore"
        :loadingMore="loadingMoreReviews"
        :deletingId="deletingReviewId"
        @delete="removeReview"
        @loadMore="loadMoreReviews"
      />
    </template>
  </div>
</template>
