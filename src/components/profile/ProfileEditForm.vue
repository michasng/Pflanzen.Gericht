<script setup lang="ts">
import { ref } from 'vue'
import AlertMessage from '@/components/AlertMessage.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import FormField from '@/components/primitives/FormField.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import type { ProfileUpdates } from '@/services/ProfileGateway'

const DISPLAY_NAME_MAX_LENGTH = 60
const BIO_MAX_LENGTH = 200
const BIO_ROWS = 2

const props = defineProps<{
  initialDisplayName: string | null
  initialBio: string | null
  saving: boolean
  errorMessage: string | null
}>()

const emit = defineEmits<{ save: [updates: ProfileUpdates]; cancel: [] }>()

const displayName = ref(props.initialDisplayName ?? '')
const bio = ref(props.initialBio ?? '')

const handleSubmit = (): void => {
  emit('save', {
    displayName: displayName.value.trim() || null,
    bio: bio.value.trim() || null,
  })
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="handleSubmit">
    <FormField label="Anzeigename" inputId="displayName">
      <TextInput
        id="displayName"
        v-model="displayName"
        :maxlength="DISPLAY_NAME_MAX_LENGTH"
        placeholder="z. B. Grüne Gabel"
      />
    </FormField>
    <FormField label="Bio" inputId="bio">
      <textarea
        id="bio"
        v-model="bio"
        :rows="BIO_ROWS"
        :maxlength="BIO_MAX_LENGTH"
        placeholder="Ein paar Worte über dich …"
        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
      />
    </FormField>
    <AlertMessage :message="errorMessage" />
    <div class="flex gap-2">
      <Button
        ariaLabel="Speichern"
        type="submit"
        :variant="ButtonVariant.Filled"
        full-width
        :disabled="saving"
      >
        {{ saving ? 'Speichert …' : 'Speichern' }}
      </Button>
      <Button
        ariaLabel="Abbrechen"
        :variant="ButtonVariant.Outlined"
        full-width
        @click="emit('cancel')"
      >
        Abbrechen
      </Button>
    </div>
  </form>
</template>
