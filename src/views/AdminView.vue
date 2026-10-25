<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { injectGateway } from '@/composables/injectGateway'
import { adminGatewayKey } from '@/services/AdminGateway'
import type { ProductListItem } from '@/services/catalog'
import { orderProductPairByCreation } from '@/lib/orderProductPairByCreation'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { useDeletableList } from '@/composables/useDeletableList'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import TabBar from '@/components/primitives/TabBar.vue'
import type { TabBarItem } from '@/components/primitives/TabBarItem'
import AdminProductList from '@/components/admin/AdminProductList.vue'
import CatalogSearchInput from '@/components/catalog/CatalogSearchInput.vue'
import AdminReviewList from '@/components/admin/AdminReviewList.vue'
import { AdminTab } from '@/components/admin/AdminTab'

const router = useRouter()
const adminGateway = injectGateway(adminGatewayKey)

const activeTab = ref(AdminTab.Products)
const actionError = ref<string | null>(null)
const productSearch = ref('')
const initialized = ref(false)
const initialLoadError = ref<string | null>(null)

const reportError = (message: string): void => {
  actionError.value = message
}

const {
  items: products,
  loadError: productsLoadError,
  hasMore: productsHaveMore,
  loadingMore: loadingMoreProducts,
  loadFirstPage: loadFirstProductPage,
  loadMore: loadMoreProducts,
} = usePaginatedList({
  fetchPage: (page) => adminGateway.fetchProductsPage(page, productSearch.value),
  pageSize: adminGateway.productPageSize,
  reportError,
})

const { deletingId: deletingProductId, remove: removeProduct } = useDeletableList({
  items: products,
  deleteItem: adminGateway.deleteProduct,
  reportError,
})

const {
  items: reviews,
  loadError: reviewsLoadError,
  hasMore: reviewsHaveMore,
  loadingMore: loadingMoreReviews,
  loadFirstPage: loadFirstReviewPage,
  loadMore: loadMoreReviews,
} = usePaginatedList({
  fetchPage: adminGateway.fetchReviewsPage,
  pageSize: adminGateway.reviewPageSize,
  reportError,
})

const { deletingId: deletingReviewId, remove: removeReview } = useDeletableList({
  items: reviews,
  deleteItem: adminGateway.deleteReview,
  reportError,
})

const tabs = computed<TabBarItem<AdminTab>[]>(() => [
  {
    value: AdminTab.Products,
    label: `Produkte (${products.value.length})`,
    ariaLabel: 'Produkte',
  },
  {
    value: AdminTab.Reviews,
    label: `Bewertungen (${reviews.value.length})`,
    ariaLabel: 'Bewertungen',
  },
])

void Promise.all([loadFirstProductPage(), loadFirstReviewPage()]).then(() => {
  initialLoadError.value = productsLoadError.value ?? reviewsLoadError.value
  initialized.value = true
})

const handleSearchProducts = async (search: string): Promise<void> => {
  productSearch.value = search
  actionError.value = null
  await loadFirstProductPage()
}

const handleDeleteProducts = async (ids: string[]): Promise<void> => {
  actionError.value = null
  for (const id of ids) {
    await removeProduct(id)
  }
}

const handleDeleteReview = async (id: string): Promise<void> => {
  actionError.value = null
  await removeReview(id)
}

const handleLoadMoreProducts = async (): Promise<void> => {
  actionError.value = null
  await loadMoreProducts()
}

const handleLoadMoreReviews = async (): Promise<void> => {
  actionError.value = null
  await loadMoreReviews()
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

    <LoadingText v-if="!initialized" />
    <AlertMessage v-else-if="initialLoadError" :message="initialLoadError" />

    <template v-else>
      <TabBar v-model="activeTab" :tabs="tabs" class="mb-4" />

      <AlertMessage v-if="actionError" :message="actionError" class="mb-4" />

      <template v-if="activeTab === AdminTab.Products">
        <CatalogSearchInput :search="productSearch" @search="handleSearchProducts" />
        <AlertMessage v-if="productsLoadError" :message="productsLoadError" class="mb-4" />
        <AdminProductList
          :products="products"
          :searching="productSearch.trim() !== ''"
          :hasMore="productsHaveMore"
          :loadingMore="loadingMoreProducts"
          :deletingId="deletingProductId"
          @delete="handleDeleteProducts"
          @merge="handleMergeProducts"
          @loadMore="handleLoadMoreProducts"
        />
      </template>
      <AdminReviewList
        v-else
        :reviews="reviews"
        :hasMore="reviewsHaveMore"
        :loadingMore="loadingMoreReviews"
        :deletingId="deletingReviewId"
        @delete="handleDeleteReview"
        @loadMore="handleLoadMoreReviews"
      />
    </template>
  </div>
</template>
