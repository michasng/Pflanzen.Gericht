<script setup lang="ts">
import type { AdminReviewItem } from '@/services/reviews'
import AdminReviewCard from '@/components/admin/AdminReviewCard.vue'
import LoadMoreButton from '@/components/LoadMoreButton.vue'

defineProps<{
  reviews: AdminReviewItem[]
  hasMore: boolean
  loadingMore: boolean
  deletingId: string | null
}>()

const emit = defineEmits<{
  delete: [id: string]
  loadMore: []
}>()

const handleDeleteReview = (id: string): void => {
  if (!confirm('Bewertung unwiderruflich löschen?')) return
  emit('delete', id)
}
</script>

<template>
  <p v-if="reviews.length === 0" class="py-12 text-center text-gray-400 text-sm">
    Keine Bewertungen vorhanden.
  </p>
  <ul v-else class="space-y-2">
    <li v-for="review in reviews" :key="review.id">
      <AdminReviewCard
        :review="review"
        :deleting="deletingId === review.id"
        @delete="handleDeleteReview(review.id)"
      />
    </li>
  </ul>
  <div v-if="hasMore" class="mt-4 text-center">
    <LoadMoreButton
      ariaLabel="Mehr Bewertungen laden"
      :loading="loadingMore"
      @click="emit('loadMore')"
    />
  </div>
</template>
