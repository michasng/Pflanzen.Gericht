<script setup lang="ts">
import { useRoute } from 'vue-router'
import BookmarkIcon from '@/components/BookmarkIcon.vue'
import ProductBookmark from '@/components/product/ProductBookmark.vue'
import ButtonLink from '@/components/primitives/ButtonLink.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'

defineProps<{
  productId: string
  currentUserId: string | null
}>()

const route = useRoute()
</script>

<template>
  <ProductBookmark v-if="currentUserId" :product-id="productId" :owner-id="currentUserId" />
  <ButtonLink
    v-else
    :to="{ name: 'login', query: { redirect: route.fullPath } }"
    :variant="ButtonVariant.Icon"
    aria-label="Listen verwalten"
  >
    <BookmarkIcon />
  </ButtonLink>
</template>
