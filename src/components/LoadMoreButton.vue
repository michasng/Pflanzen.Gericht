<script setup lang="ts">
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'

defineProps<{
  ariaLabel: string
  loading: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <Button
    :ariaLabel="ariaLabel"
    :variant="ButtonVariant.Outlined"
    :size="ButtonSize.Comfortable"
    :disabled="loading"
    @click="emit('click')"
  >
    {{ loading ? 'Lädt …' : 'Mehr laden' }}
  </Button>
</template>
