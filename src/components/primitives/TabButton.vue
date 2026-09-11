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
    role="tab"
    :aria-selected="active"
    :aria-label="ariaLabel"
    class="flex flex-1 items-center justify-center rounded-none px-0 py-2.5 text-sm font-medium transition-colors"
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
