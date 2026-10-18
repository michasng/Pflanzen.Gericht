<script setup lang="ts">
import type { AdminReviewItem } from '@/services/reviews'
import ReviewSummaryCard from '@/components/ReviewSummaryCard.vue'
import LoadMoreButton from '@/components/LoadMoreButton.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import ButtonLink from '@/components/primitives/ButtonLink.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'
import Chip from '@/components/primitives/ChipComponent.vue'
import { ChipSize } from '@/components/primitives/ChipSize'
import { ChipTone } from '@/components/primitives/ChipTone'

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
      <ReviewSummaryCard
        :review="review"
        :author="{ id: review.userId, username: review.profile.username }"
      >
        <template #status>
          <Chip v-if="!review.isCurrent" :size="ChipSize.Compact" :tone="ChipTone.Muted">
            Veraltet
          </Chip>
        </template>
        <template #actions>
          <ButtonLink
            :to="{ name: 'review-edit', params: { reviewId: review.id } }"
            :variant="ButtonVariant.Text"
            :size="ButtonSize.Small"
          >
            Bearbeiten
          </ButtonLink>
          <Button
            ariaLabel="Bewertung löschen"
            :variant="ButtonVariant.Text"
            :size="ButtonSize.Small"
            :tone="ButtonTone.Danger"
            :disabled="deletingId === review.id"
            @click="handleDeleteReview(review.id)"
          >
            {{ deletingId === review.id ? 'Löscht …' : 'Löschen' }}
          </Button>
        </template>
      </ReviewSummaryCard>
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
