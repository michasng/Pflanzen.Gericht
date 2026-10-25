<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '@/lib/date'
import { resolveReviewCoverImage } from '@/lib/resolveReviewCoverImage'
import type { CoverImageCandidate } from '@/lib/CoverImageCandidate'
import type { Review } from '@/types'
import StarDisplay from '@/components/StarDisplay.vue'
import TagList from '@/components/TagList.vue'
import Card from '@/components/primitives/CardComponent.vue'
import CoverImage from '@/components/CoverImage.vue'

const props = defineProps<{
  review: Pick<Review, 'overall' | 'createdAt' | 'comment'> & {
    product: { id: string; name: string; images: CoverImageCandidate[] }
    images: CoverImageCandidate[]
    tags?: string[]
  }
  author?: { id: string; username: string }
}>()

const coverImage = computed(() => resolveReviewCoverImage(props.review))
</script>

<template>
  <Card>
    <div class="flex items-start gap-2 mb-2">
      <slot name="leading" />
      <CoverImage :source="coverImage" :alt="review.product.name" />
      <div class="min-w-0 flex-1">
        <RouterLink
          :to="{ name: 'product-detail', params: { id: review.product.id } }"
          class="font-semibold text-gray-900 hover:text-primary-600 transition-colors leading-tight"
        >
          {{ review.product.name }}
        </RouterLink>
        <p v-if="author" class="text-sm text-gray-500 mt-0.5">
          von
          <RouterLink
            :to="{ name: 'profile-public', params: { id: author.id } }"
            class="hover:text-primary-600 transition-colors"
          >
            {{ author.username }}
          </RouterLink>
        </p>
        <div class="flex items-center gap-2 mt-1">
          <StarDisplay :value="review.overall" />
          <span class="text-xs text-gray-400">{{ formatDate(review.createdAt) }}</span>
        </div>
      </div>
      <div v-if="$slots.status" class="shrink-0">
        <slot name="status" />
      </div>
    </div>

    <TagList v-if="review.tags" :tags="review.tags" class="mb-2" />

    <p v-if="review.comment" class="text-sm text-gray-600 mb-2 line-clamp-2">
      {{ review.comment }}
    </p>

    <div v-if="$slots.actions" class="flex gap-3 pt-2 border-t border-gray-50">
      <slot name="actions" />
    </div>
  </Card>
</template>
