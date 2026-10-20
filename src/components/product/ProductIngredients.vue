<script setup lang="ts">
import { computed } from 'vue'
import type { ProductIngredient } from '@/types'
import type { IngredientComparator } from '@/config/ingredients'
import { formatIngredientLabel } from '@/config/formatIngredientLabel'
import SectionCard from '@/components/SectionCard.vue'

const props = defineProps<{ ingredients: readonly ProductIngredient[] }>()

const orderedIngredients = computed(() =>
  [...props.ingredients]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      fractionBasisPoints: ingredient.fractionBasisPoints,
      // the database stores the comparator as plain text
      comparator: ingredient.comparator as IngredientComparator,
    })),
)
</script>

<template>
  <SectionCard v-if="orderedIngredients.length" title="Zutaten">
    <p class="text-sm text-gray-600">
      <template v-for="(ingredient, index) in orderedIngredients" :key="ingredient.id">
        <span v-if="index > 0">, </span>{{ formatIngredientLabel(ingredient) }}
      </template>
    </p>
  </SectionCard>
</template>
