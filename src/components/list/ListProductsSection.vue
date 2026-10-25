<script setup lang="ts">
import { onMounted } from 'vue'
import { injectGateway } from '@/composables/injectGateway'
import { useListProducts } from '@/composables/useListProducts'
import { listGatewayKey } from '@/services/ListGateway'
import { similarProductsGatewayKey } from '@/services/SimilarProductsGateway'
import AlertMessage from '@/components/AlertMessage.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMoreButton from '@/components/LoadMoreButton.vue'
import LoadingText from '@/components/LoadingText.vue'
import ProductSearch from '@/components/ProductSearch.vue'
import ProductSummaryCard from '@/components/ProductSummaryCard.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'

const LIST_PRODUCT_PAGE_SIZE = 20

const props = defineProps<{ listId: string; isOwner: boolean }>()

const listGateway = injectGateway(listGatewayKey)
const { searchProductCandidates } = injectGateway(similarProductsGatewayKey)

const {
  products,
  loading,
  loadError,
  hasMore,
  loadingMore,
  removingId,
  actionError,
  loadFirstPage,
  loadMore,
  add,
  remove,
  searchAddableProducts,
} = useListProducts({
  gateway: listGateway,
  listId: props.listId,
  pageSize: LIST_PRODUCT_PAGE_SIZE,
  searchProducts: searchProductCandidates,
})

onMounted(loadFirstPage)
</script>

<template>
  <div class="space-y-4">
    <ProductSearch v-if="isOwner" :search="searchAddableProducts" :select="add" />
    <AlertMessage :message="actionError" />

    <LoadingText v-if="loading" />
    <AlertMessage v-else-if="loadError" :message="loadError" />
    <template v-else>
      <EmptyState
        v-if="products.length === 0"
        compact
        :title="
          isOwner
            ? 'Noch keine Produkte auf dieser Liste. Suche oben nach Produkten, um sie hinzuzufügen.'
            : 'Noch keine Produkte auf dieser Liste.'
        "
      />
      <ul v-else class="space-y-2">
        <li v-for="product in products" :key="product.id">
          <ProductSummaryCard :product="product" :addedAt="product.addedAt">
            <template v-if="isOwner" #actions>
              <Button
                ariaLabel="Entfernen"
                :variant="ButtonVariant.Text"
                :size="ButtonSize.Small"
                :tone="ButtonTone.Danger"
                :disabled="removingId === product.id"
                @click="remove(product.id)"
              >
                {{ removingId === product.id ? 'Entfernt …' : 'Entfernen' }}
              </Button>
            </template>
          </ProductSummaryCard>
        </li>
      </ul>
      <div v-if="hasMore" class="text-center">
        <LoadMoreButton ariaLabel="Mehr Produkte laden" :loading="loadingMore" @click="loadMore" />
      </div>
    </template>
  </div>
</template>
