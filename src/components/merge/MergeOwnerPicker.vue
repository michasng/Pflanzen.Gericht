<script setup lang="ts">
import { COMPARISON_SIDES, ComparisonSide } from '@/types/ComparisonSide'

defineProps<{ sideLabels: Record<ComparisonSide, string> }>()

const ownerSide = defineModel<ComparisonSide | null>({ required: true })
</script>

<template>
  <fieldset>
    <legend class="text-sm font-medium text-gray-700 mb-2">
      Besitzer <span class="text-red-500" aria-hidden="true">*</span>
    </legend>
    <div class="flex gap-4">
      <label v-for="side in COMPARISON_SIDES" :key="side" class="flex items-center gap-2 text-sm">
        <input v-model="ownerSide" type="radio" name="owner" :value="side" />
        {{ sideLabels[side] }}
      </label>
    </div>
  </fieldset>
</template>
