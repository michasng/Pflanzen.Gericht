<script setup lang="ts">
import ButtonLink from '@/components/primitives/ButtonLink.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'

defineProps<{ message: string }>()
</script>

<template>
  <div class="py-20 text-center">
    <p class="font-semibold text-gray-600 mb-2">{{ message }}</p>
    <ButtonLink :to="{ name: 'home' }" :variant="ButtonVariant.Text" :size="ButtonSize.Small">
      Zurück zur Übersicht
    </ButtonLink>
  </div>
</template>
