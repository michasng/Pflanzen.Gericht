<script setup lang="ts">
import { computed } from 'vue'
import { averageReviewCriteria, type ReviewCriteriaScores } from '@/lib/averageReviewCriteria'
import StarDisplay from '@/components/StarDisplay.vue'
import ReviewScoreDimensions from '@/components/ReviewScoreDimensions.vue'
import SectionCard from '@/components/SectionCard.vue'

const props = defineProps<{
  averageOverall: number | null
  reviewsCount: number
  reviews: readonly ReviewCriteriaScores[]
}>()

const criteriaAverages = computed(() => averageReviewCriteria(props.reviews))
</script>

<template>
  <SectionCard>
    <p v-if="reviewsCount === 0" class="text-sm text-gray-400 text-center py-2">
      Noch keine Bewertungen — sei der Erste!
    </p>
    <template v-else>
      <div class="flex items-center gap-4">
        <span class="text-4xl font-bold text-gray-900 tabular-nums">
          {{ averageOverall?.toFixed(1) }}
        </span>
        <div>
          <StarDisplay :value="averageOverall" size="md" />
          <p class="text-xs text-gray-400 mt-0.5">
            {{ reviewsCount }}
            Bewertung{{ reviewsCount !== 1 ? 'en' : '' }}
          </p>
        </div>
      </div>

      <ReviewScoreDimensions
        v-if="criteriaAverages.length"
        class="mt-4"
        :scores="criteriaAverages"
      />
    </template>
  </SectionCard>
</template>
