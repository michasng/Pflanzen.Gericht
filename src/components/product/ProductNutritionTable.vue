<script setup lang="ts">
import { computed } from 'vue'
import type { ProductNutrient } from '@/types'
import { NUTRIENT_PARENT_NAME } from '@/config/nutrientHierarchy'
import { formatEnergy } from '@/lib/formatEnergy'
import { formatNutrientAmount } from '@/lib/formatNutrientAmount'
import { getNutrientHierarchyDepth } from '@/lib/getNutrientHierarchyDepth'
import { sortNutrientsByHierarchy } from '@/lib/sortNutrientsByHierarchy'
import SectionCard from '@/components/SectionCard.vue'

const props = defineProps<{
  energyJoules: number | null
  nutrients: readonly ProductNutrient[]
}>()

const NUTRIENT_INDENT_CLASSES_BY_DEPTH = ['', 'pl-4', 'pl-8']

const sortedNutrients = computed(() => sortNutrientsByHierarchy(props.nutrients))

const nutrientIndentClass = (name: string): string =>
  NUTRIENT_INDENT_CLASSES_BY_DEPTH[getNutrientHierarchyDepth(name)] ?? ''

const nutrientLabel = (name: string): string =>
  NUTRIENT_PARENT_NAME.has(name) ? `davon ${name}` : name
</script>

<template>
  <SectionCard v-if="energyJoules != null || sortedNutrients.length" title="Nährwerte">
    <p class="text-xs text-gray-400 mb-2">pro 100 g/ml</p>
    <table class="w-full text-sm">
      <tbody class="divide-y divide-gray-50">
        <tr v-if="energyJoules != null">
          <td class="py-1.5 pr-2 text-gray-600">Energie</td>
          <td class="py-1.5 text-right font-medium text-gray-900 tabular-nums">
            {{ formatEnergy(energyJoules) }}
          </td>
        </tr>
        <tr v-for="nutrient in sortedNutrients" :key="nutrient.id">
          <td class="py-1.5 pr-2 text-gray-600" :class="nutrientIndentClass(nutrient.name)">
            {{ nutrientLabel(nutrient.name) }}
          </td>
          <td class="py-1.5 text-right font-medium text-gray-900 tabular-nums">
            {{ formatNutrientAmount(nutrient.amountMicrograms) }}
          </td>
        </tr>
      </tbody>
    </table>
  </SectionCard>
</template>
