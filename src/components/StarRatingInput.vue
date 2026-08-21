<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: number | null
  required?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const hover = ref<number | null>(null)
const displayed = computed(() => hover.value ?? props.modelValue)

function select(i: number): void {
  if (!props.required && props.modelValue === i) {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', i)
  }
}
</script>

<template>
  <div class="flex gap-0.5" role="group">
    <button
      v-for="i in 5"
      :key="i"
      type="button"
      class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      :aria-label="`${i} Stern${i > 1 ? 'e' : ''}`"
      :aria-pressed="modelValue === i"
      @click="select(i)"
      @mouseenter="hover = i"
      @mouseleave="hover = null"
    >
      <svg
        class="w-7 h-7 transition-colors"
        :class="displayed !== null && i <= displayed ? 'text-amber-400' : 'text-gray-200'"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    </button>
  </div>
</template>
