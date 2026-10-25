<script setup lang="ts">
import { ref } from 'vue'
import BookmarkIcon from '@/components/BookmarkIcon.vue'
import ProductBookmarkDialog from '@/components/product/ProductBookmarkDialog.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { injectProductBookmarks } from '@/composables/injectProductBookmarks'
import type { ListInput } from '@/services/ListGateway'

const props = defineProps<{ productId: string }>()

const bookmarks = injectProductBookmarks()

const dialogOpen = ref(false)

const saveList = (input: ListInput): Promise<void> =>
  bookmarks.createListWithProduct(props.productId, input)
</script>

<template>
  <Button ariaLabel="Listen verwalten" :variant="ButtonVariant.Icon" @click="dialogOpen = true">
    <BookmarkIcon :filled="bookmarks.isBookmarked(productId)" />
  </Button>
  <ProductBookmarkDialog
    v-if="dialogOpen"
    :lists="bookmarks.lists.value"
    :list-ids-with-product="bookmarks.listIdsWithProduct(productId)"
    :loading="bookmarks.loading.value"
    :load-error="bookmarks.loadError.value"
    :action-error="bookmarks.actionError.value"
    :toggling-list-id="bookmarks.togglingListId.value"
    :save="saveList"
    @toggle="bookmarks.toggle(productId, $event)"
    @close="dialogOpen = false"
  />
</template>
