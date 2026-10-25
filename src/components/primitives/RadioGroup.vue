<script setup lang="ts" generic="Value extends string">
interface RadioOption {
  value: Value
  label: string
}

defineProps<{
  legend: string
  name: string
  options: RadioOption[]
  error?: string | null
}>()

const model = defineModel<Value | null>({ required: true })
</script>

<template>
  <fieldset>
    <legend class="block text-sm font-medium text-gray-700 mb-1.5">{{ legend }}</legend>
    <div class="flex gap-4">
      <label
        v-for="option in options"
        :key="option.value"
        class="inline-flex items-center gap-2 text-sm text-gray-700"
      >
        <input
          v-model="model"
          type="radio"
          :name="name"
          :value="option.value"
          class="h-4 w-4 accent-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {{ option.label }}
      </label>
    </div>
    <p v-if="error" class="mt-1 text-xs text-red-600" role="alert">{{ error }}</p>
  </fieldset>
</template>
