<script setup lang="ts">
import { useRoute } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import ButtonLink from '@/components/primitives/ButtonLink.vue'
import SpotlightButtonLink from '@/components/primitives/SpotlightButtonLink.vue'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'

defineProps<{
  productId: string
  isLoggedIn: boolean
  hasReviewed: boolean
  canManage: boolean
  errorMessage: string | null
}>()

defineEmits<{ delete: [] }>()

const route = useRoute()
</script>

<template>
  <div class="flex flex-col gap-2">
    <ButtonLink
      v-if="isLoggedIn && hasReviewed"
      :to="{ name: 'review-new', params: { id: productId } }"
      :size="ButtonSize.Large"
      full-width
    >
      Produkt erneut bewerten
    </ButtonLink>
    <SpotlightButtonLink
      v-else-if="isLoggedIn"
      :to="{ name: 'review-new', params: { id: productId } }"
    >
      Produkt bewerten
    </SpotlightButtonLink>
    <ButtonLink
      v-else
      :to="{ name: 'login', query: { redirect: route.fullPath } }"
      :variant="ButtonVariant.Outlined"
      :tone="ButtonTone.Primary"
      :size="ButtonSize.Large"
      full-width
    >
      Anmelden zum Bewerten
    </ButtonLink>
    <div v-if="canManage" class="flex gap-2">
      <ButtonLink
        :to="{ name: 'product-edit', params: { id: productId } }"
        :variant="ButtonVariant.Outlined"
        :size="ButtonSize.Large"
        full-width
      >
        Bearbeiten
      </ButtonLink>
      <Button
        :variant="ButtonVariant.Outlined"
        :tone="ButtonTone.Danger"
        :size="ButtonSize.Large"
        full-width
        ariaLabel="Produkt löschen"
        @click="$emit('delete')"
      >
        Löschen
      </Button>
    </div>
    <AlertMessage :message="errorMessage" />
  </div>
</template>
