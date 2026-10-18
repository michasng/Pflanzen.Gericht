<script setup lang="ts">
import { computed, watch } from 'vue'
import FormField from '@/components/primitives/FormField.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import { TextInputState } from '@/components/primitives/TextInputState'
import { useAuthGateway } from '@/composables/useAuthGateway'
import {
  USERNAME_FORMAT_PATTERN,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  useUsernameAvailability,
} from '@/composables/useUsernameAvailability'

const FORMAT_MESSAGE = `Nur Kleinbuchstaben, Ziffern und _ (${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} Zeichen).`
const TAKEN_MESSAGE = 'Dieser Nutzername ist bereits vergeben.'

defineEmits<{ edit: [] }>()

const username = defineModel<string>({ required: true })
const available = defineModel<boolean | null>('available', { default: null })

const authGateway = useAuthGateway()
const { isAvailable, isChecking, checkError } = useUsernameAvailability(username, (name) =>
  authGateway.isUsernameAvailable(name),
)

watch(isAvailable, (value) => (available.value = value), { immediate: true })

const errorMessage = computed(() => {
  if (!username.value) return null
  if (!USERNAME_FORMAT_PATTERN.test(username.value)) return FORMAT_MESSAGE
  if (isAvailable.value === false) return TAKEN_MESSAGE
  return checkError.value
})

const state = computed(() => {
  if (errorMessage.value) return TextInputState.Invalid
  if (isAvailable.value === true) return TextInputState.Valid
  return TextInputState.Default
})
</script>

<template>
  <FormField label="Nutzername" input-id="username" :error="errorMessage">
    <TextInput
      id="username"
      v-model="username"
      autocomplete="username"
      required
      :minlength="USERNAME_MIN_LENGTH"
      :maxlength="USERNAME_MAX_LENGTH"
      placeholder="gruene_gabel"
      :state="state"
      @input="$emit('edit')"
    >
      <template #prefix>@</template>
      <template v-if="isChecking" #suffix><span class="text-gray-400">…</span></template>
      <template v-else-if="isAvailable === true" #suffix>
        <span class="text-green-500">✓</span>
      </template>
    </TextInput>
  </FormField>
</template>
