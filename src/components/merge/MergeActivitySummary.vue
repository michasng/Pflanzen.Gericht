<script setup lang="ts">
import Card from '@/components/primitives/CardComponent.vue'
import { formatCountWithNoun } from '@/lib/formatCountWithNoun'
import { COMPARISON_SIDES, ComparisonSide } from '@/types/ComparisonSide'
import type { ProductActivityCounts } from '@/services/fetchProductActivityCounts'

defineProps<{
  sideLabels: Record<ComparisonSide, string>
  activityCounts: Record<ComparisonSide, ProductActivityCounts>
}>()
</script>

<template>
  <Card>
    <p class="text-sm font-medium text-gray-700 mb-2">
      Bewertungen, Preise und Ähnliche Produkte werden vereint
    </p>
    <ul class="text-sm text-gray-600 space-y-0.5">
      <li v-for="side in COMPARISON_SIDES" :key="side">
        {{ sideLabels[side] }}:
        {{ formatCountWithNoun(activityCounts[side].reviewsCount, 'Bewertung', 'Bewertungen') }},
        {{ formatCountWithNoun(activityCounts[side].priceReportsCount, 'Preis', 'Preise') }},
        {{
          formatCountWithNoun(
            activityCounts[side].similarityVotesCount,
            'Ähnliches Produkt',
            'Ähnliche Produkte',
          )
        }}
      </li>
    </ul>
  </Card>
</template>
