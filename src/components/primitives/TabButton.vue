<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: boolean
    ariaLabel: string
  }>(),
  {
    active: false,
  },
)

defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    :aria-label="ariaLabel"
    class="flex-1 rounded-none px-0 py-2.5 text-sm font-medium transition-colors"
    :class="
      active
        ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
        : 'text-gray-500 hover:text-gray-700'
    "
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>
