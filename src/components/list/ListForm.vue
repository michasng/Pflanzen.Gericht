<script setup lang="ts">
import { ListVisibility } from '@/config/ListVisibility'
import { LIST_VISIBILITY_LABELS } from '@/config/listVisibilityLabels'
import { useListForm } from '@/composables/useListForm'
import type { ListInput } from '@/services/ListGateway'
import AlertMessage from '@/components/AlertMessage.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import FormField from '@/components/primitives/FormField.vue'
import RadioGroup from '@/components/primitives/RadioGroup.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import { TextInputState } from '@/components/primitives/TextInputState'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'

const LIST_NAME_MAX_LENGTH = 50

const props = defineProps<{
  idPrefix: string
  initialName?: string
  initialVisibility?: ListVisibility
  save: (input: ListInput) => Promise<void>
}>()

const emit = defineEmits<{ saved: []; cancel: [] }>()

const VISIBILITY_OPTIONS = Object.values(ListVisibility).map((value) => ({
  value,
  label: LIST_VISIBILITY_LABELS[value],
}))

const { name, visibility, nameError, visibilityError, errorMessage, saving, submit } = useListForm({
  initialName: props.initialName,
  initialVisibility: props.initialVisibility,
  save: props.save,
  onSaved: () => emit('saved'),
})
</script>

<template>
  <form class="space-y-3" novalidate @submit.prevent="submit">
    <FormField label="Name" :inputId="`${idPrefix}-name`" :error="nameError">
      <TextInput
        :id="`${idPrefix}-name`"
        v-model="name"
        :maxlength="LIST_NAME_MAX_LENGTH"
        :state="nameError ? TextInputState.Invalid : TextInputState.Default"
        placeholder="z. B. Favoriten"
      />
    </FormField>
    <RadioGroup
      v-model="visibility"
      legend="Sichtbarkeit"
      :name="`${idPrefix}-visibility`"
      :options="VISIBILITY_OPTIONS"
      :error="visibilityError"
    />
    <AlertMessage :message="errorMessage" />
    <div class="flex gap-2">
      <Button
        ariaLabel="Liste speichern"
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
