<script setup lang="ts">
import { computed } from 'vue'
import StarDisplay from '@/components/StarDisplay.vue'
import TagList from '@/components/TagList.vue'
import CardComponent from '@/components/ui/CardComponent.vue'
import ChipComponent from '@/components/ui/ChipComponent.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import { ProgressBarColor } from '@/components/ui/ProgressBarColor'
import type { RatingWithDetails } from '@/services/catalog'
import { formatDate } from '@/lib/date'

const MAX_CRITERION_VALUE = 5

const props = defineProps<{ rating: RatingWithDetails; editable?: boolean }>()

const displayName = computed(
  () => props.rating.profile.display_name || props.rating.profile.username,
)

const filledCriteria = computed(() => {
  const entries: [string, number][] = [
    ['Geschmack', props.rating.taste],
    ['Konsistenz', props.rating.consistency],
    ['Aussehen', props.rating.appearance],
    ['Nährwerte', props.rating.nutrition],
    ['Preis-Leistung', props.rating.value],
  ].filter((e): e is [string, number] => e[1] !== null)
  return entries
})
</script>

<template>
  <CardComponent>
    <div class="flex items-start justify-between gap-2 mb-3">
      <div>
        <RouterLink
          :to="{ name: 'profile-public', params: { id: rating.user_id } }"
          class="font-semibold text-sm text-gray-900 hover:text-primary-600 transition-colors"
        >
          {{ displayName }}
        </RouterLink>
        <span class="text-xs text-gray-400 ml-2">{{ formatDate(rating.created_at) }}</span>
      </div>
      <ChipComponent v-if="!rating.is_current" class="shrink-0">Veraltet</ChipComponent>
    </div>

    <div class="flex items-center gap-2 mb-3">
      <StarDisplay :value="rating.overall" size="md" />
      <span class="text-sm font-semibold text-gray-700">{{ rating.overall }}/5</span>
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

    <TagList :tags="rating.tags" class="mb-3" />

    <p v-if="rating.comment" class="text-sm text-gray-600 mb-3">{{ rating.comment }}</p>

    <div v-if="editable" class="mt-3 pt-2 border-t border-gray-50">
      <RouterLink
        :to="{ name: 'rating-edit', params: { ratingId: rating.id } }"
        class="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
      >
        Bearbeiten
      </RouterLink>
    </div>
  </CardComponent>
</template>
