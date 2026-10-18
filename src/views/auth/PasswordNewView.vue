<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { PASSWORD_MIN_LENGTH, validateNewPassword } from '@/lib/validateNewPassword'
import AlertMessage from '@/components/AlertMessage.vue'
import AuthLayout from '@/components/AuthLayout.vue'
import FormField from '@/components/primitives/FormField.vue'
import TextInput from '@/components/primitives/TextInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const password = ref('')
const passwordConfirm = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

const handleSubmit = async (): Promise<void> => {
  error.value = validateNewPassword(password.value, passwordConfirm.value) ?? null
  if (error.value) return

  loading.value = true
  try {
    await authStore.updatePassword(password.value)
    await router.push({ name: 'home' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Passwort konnte nicht gesetzt werden.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="text-xl font-bold text-gray-900 mb-6">Neues Passwort setzen</h1>

    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <FormField label="Neues Passwort" input-id="password">
        <TextInput
          id="password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          required
          :minlength="PASSWORD_MIN_LENGTH"
        />
      </FormField>

      <FormField label="Passwort bestätigen" input-id="password-confirm">
        <TextInput
          id="password-confirm"
          v-model="passwordConfirm"
          type="password"
          autocomplete="new-password"
          required
          :minlength="PASSWORD_MIN_LENGTH"
        />
      </FormField>

      <AlertMessage :message="error" />

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
      >
        {{ loading ? 'Wird gespeichert …' : 'Passwort speichern' }}
      </button>
    </form>
  </AuthLayout>
</template>
