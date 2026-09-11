<script setup lang="ts">
import { computed } from 'vue'
import StarDisplay from '@/components/StarDisplay.vue'
import TagList from '@/components/TagList.vue'
import ReviewImageGallery from '@/components/ReviewImageGallery.vue'
import Card from '@/components/primitives/CardComponent.vue'
import Chip from '@/components/primitives/ChipComponent.vue'
import { ChipSize } from '@/components/primitives/ChipSize'
import { ChipTone } from '@/components/primitives/ChipTone'
import ProgressBar from '@/components/primitives/ProgressBar.vue'
import { ProgressBarColor } from '@/components/primitives/ProgressBarColor'
import type { ReviewWithDetails } from '@/services/catalog'
import { formatDate } from '@/lib/date'

const MAX_CRITERION_VALUE = 5

const props = defineProps<{ review: ReviewWithDetails; editable?: boolean }>()

const displayName = computed(
  () => props.review.profile.display_name || props.review.profile.username,
)

const filledCriteria = computed(() => {
  const entries: [string, number][] = [
    ['Geschmack', props.review.taste],
    ['Konsistenz', props.review.consistency],
    ['Aussehen', props.review.appearance],
    ['Nährwerte', props.review.nutrition],
    ['Preis-Leistung', props.review.value],
  ].filter((e): e is [string, number] => e[1] !== null)
  return entries
})
</script>

<template>
  <Card>
    <div class="flex items-start justify-between gap-2 mb-3">
      <div>
        <RouterLink
          :to="{ name: 'profile-public', params: { id: review.user_id } }"
          class="font-semibold text-sm text-gray-900 hover:text-primary-600 transition-colors"
        >
          {{ displayName }}
        </RouterLink>
        <span class="text-xs text-gray-400 ml-2">{{ formatDate(review.created_at) }}</span>
      </div>
      <Chip
        v-if="!review.is_current"
        class="shrink-0"
        :size="ChipSize.Compact"
        :tone="ChipTone.Muted"
      >
        Veraltet
      </Chip>
    </div>

    <div class="flex items-center gap-2 mb-3">
      <StarDisplay :value="review.overall" size="md" />
      <span class="text-sm font-semibold text-gray-700">{{ review.overall }}/5</span>
    </div>

    <div v-if="filledCriteria.length" class="grid grid-cols-1 gap-1.5 mb-3">
      <div v-for="[label, val] in filledCriteria" :key="label" class="flex items-center gap-2">
        <span class="text-xs text-gray-500 w-28 shrink-0">{{ label }}</span>
        <ProgressBar
          class="flex-1"
          :percent="(val / MAX_CRITERION_VALUE) * 100"
          :color="ProgressBarColor.Amber"
        />
        <span class="text-xs text-gray-500 w-4 text-right">{{ val }}</span>
      </div>
    </div>

    <TagList :tags="review.tags" class="mb-3" />

    <p v-if="review.comment" class="text-sm text-gray-600 mb-3">{{ review.comment }}</p>

    <div class="mb-3">
      <ReviewImageGallery :images="review.images" />
    </div>

    <div v-if="editable" class="mt-3 pt-2 border-t border-gray-50">
      <RouterLink
        :to="{ name: 'review-edit', params: { reviewId: review.id } }"
        class="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
      >
        Bearbeiten
      </RouterLink>
    </div>
  </Card>
</template>
