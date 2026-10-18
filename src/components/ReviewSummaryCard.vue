<script setup lang="ts">
import { formatDate } from '@/lib/date'
import type { Review } from '@/types'
import StarDisplay from '@/components/StarDisplay.vue'
import TagList from '@/components/TagList.vue'
import Card from '@/components/primitives/CardComponent.vue'

defineProps<{
  review: Pick<Review, 'overall' | 'createdAt' | 'comment'> & {
    product: { id: string; name: string }
    tags?: string[]
  }
  author?: { id: string; username: string }
}>()
</script>

<template>
  <Card>
    <div class="flex items-start gap-2 mb-2">
      <slot name="leading" />
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
      </div>
      <div v-if="$slots.status" class="shrink-0">
        <slot name="status" />
      </div>
    </div>

    <div class="flex items-center gap-2 mb-2">
      <StarDisplay :value="review.overall" />
      <span class="text-xs text-gray-400">{{ formatDate(review.createdAt) }}</span>
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
