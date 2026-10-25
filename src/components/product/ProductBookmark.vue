<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BookmarkIcon from '@/components/BookmarkIcon.vue'
import ProductBookmarkDialog from '@/components/product/ProductBookmarkDialog.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { injectGateway } from '@/composables/injectGateway'
import { useProductBookmark } from '@/composables/useProductBookmark'
import { listGatewayKey } from '@/services/ListGateway'

const props = defineProps<{ productId: string; ownerId: string }>()

const {
  lists,
  listIdsWithProduct,
  loading,
  loadError,
  actionError,
  togglingListId,
  isBookmarked,
  load,
  toggle,
  createListWithProduct,
} = useProductBookmark({
  gateway: injectGateway(listGatewayKey),
  ownerId: props.ownerId,
  productId: props.productId,
})

const dialogOpen = ref(false)

onMounted(load)
</script>

<template>
  <Button ariaLabel="Listen verwalten" :variant="ButtonVariant.Icon" @click="dialogOpen = true">
    <BookmarkIcon :filled="isBookmarked" />
  </Button>
  <ProductBookmarkDialog
    v-if="dialogOpen"
    :lists="lists"
    :list-ids-with-product="listIdsWithProduct"
    :loading="loading"
    :load-error="loadError"
    :action-error="actionError"
    :toggling-list-id="togglingListId"
    :save="createListWithProduct"
    @toggle="toggle"
    @close="dialogOpen = false"
  />
</template>
