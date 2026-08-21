<script setup lang="ts">
import { computed } from 'vue'
import StarDisplay from '@/components/StarDisplay.vue'
import { TAG_LABELS } from '@/config/taxonomy'
import type { Tag } from '@/config/taxonomy'
import type { RatingWithDetails } from '@/services/catalog'
import { formatDate } from '@/lib/date'

const props = defineProps<{ rating: RatingWithDetails }>()

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

function tagLabel(tag: string): string {
  return TAG_LABELS[tag as Tag] ?? tag
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-100 p-4">
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
      <span
        v-if="!rating.is_current"
        class="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium"
      >
        Veraltet
      </span>
    </div>

    <div class="flex items-center gap-2 mb-3">
      <StarDisplay :value="rating.overall" size="md" />
      <span class="text-sm font-semibold text-gray-700">{{ rating.overall }}/5</span>
    </div>

    <div v-if="filledCriteria.length" class="grid grid-cols-1 gap-1.5 mb-3">
      <div v-for="[label, val] in filledCriteria" :key="label" class="flex items-center gap-2">
        <span class="text-xs text-gray-500 w-28 shrink-0">{{ label }}</span>
        <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-amber-400 rounded-full" :style="{ width: `${(val / 5) * 100}%` }" />
        </div>
        <span class="text-xs text-gray-500 w-4 text-right">{{ val }}</span>
      </div>
    </div>

    <div v-if="rating.tags.length" class="flex flex-wrap gap-1 mb-3">
      <span
        v-for="tag in rating.tags"
        :key="tag"
        class="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
      >
        {{ tagLabel(tag) }}
      </span>
    </div>

    <p v-if="rating.comment" class="text-sm text-gray-600 mb-3">{{ rating.comment }}</p>

    <div v-if="rating.location || rating.price !== null" class="flex gap-3 text-xs text-gray-400">
      <span v-if="rating.location">{{ rating.location }}</span>
      <span v-if="rating.price !== null">{{ rating.price.toFixed(2).replace('.', ',') }} €</span>
    </div>
  </div>
</template>
