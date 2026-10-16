<script setup lang="ts">
import type { AdminReviewItem } from '@/services/reviews'
import { formatDate } from '@/lib/date'
import StarDisplay from '@/components/StarDisplay.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'
import Card from '@/components/primitives/CardComponent.vue'
import Chip from '@/components/primitives/ChipComponent.vue'
import { ChipSize } from '@/components/primitives/ChipSize'
import { ChipTone } from '@/components/primitives/ChipTone'

defineProps<{
  review: AdminReviewItem
  deleting: boolean
}>()

const emit = defineEmits<{
  delete: []
}>()
</script>

<template>
  <Card>
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <RouterLink
          :to="{ name: 'product-detail', params: { id: review.product.id } }"
          class="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
        >
          {{ review.product.name }}
        </RouterLink>
        <p class="text-sm text-gray-500 mt-0.5">
          von
          <RouterLink
            :to="{ name: 'profile-public', params: { id: review.userId } }"
            class="hover:text-primary-600 transition-colors"
          >
            {{ review.profile.username }}
          </RouterLink>
          <Chip v-if="!review.isCurrent" class="ml-2" :size="ChipSize.Tight" :tone="ChipTone.Muted">
            Veraltet
          </Chip>
        </p>
        <div class="flex items-center gap-2 mt-1">
          <StarDisplay :value="review.overall" />
          <span class="text-xs text-gray-400">{{ formatDate(review.createdAt) }}</span>
        </div>
      </div>
      <div class="flex gap-2 shrink-0">
        <RouterLink
          :to="{ name: 'review-edit', params: { reviewId: review.id } }"
          class="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
        >
          Bearbeiten
        </RouterLink>
        <Button
          ariaLabel="Bewertung löschen"
          :variant="ButtonVariant.Text"
          :size="ButtonSize.Small"
          :tone="ButtonTone.Danger"
          :disabled="deleting"
          @click="emit('delete')"
        >
          {{ deleting ? 'Löscht …' : 'Löschen' }}
        </Button>
      </div>
    </div>
  </Card>
</template>
