<script setup lang="ts">
import type { ReviewWithDetails } from '@/services/catalog'
import ReviewCard from '@/components/ReviewCard.vue'

const props = defineProps<{
  reviews: readonly ReviewWithDetails[]
  currentUserId: string | null
  isAdmin: boolean
}>()

const isEditable = (review: ReviewWithDetails): boolean =>
  props.currentUserId !== null &&
  (props.isAdmin || (review.userId === props.currentUserId && review.isCurrent))
</script>

<template>
  <div v-if="reviews.length" class="space-y-3">
    <ReviewCard
      v-for="review in reviews"
      :key="review.id"
      :review="review"
      :editable="isEditable(review)"
    />
  </div>
</template>
