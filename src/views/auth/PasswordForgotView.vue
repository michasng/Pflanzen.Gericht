<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AlertMessage from '@/components/AlertMessage.vue'
import AuthLayout from '@/components/AuthLayout.vue'
import AuthSuccessMessage from '@/components/AuthSuccessMessage.vue'
import FormField from '@/components/primitives/FormField.vue'
import TextInput from '@/components/primitives/TextInput.vue'

const authStore = useAuthStore()

const email = ref('')
const submitted = ref(false)
const error = ref<string | null>(null)
const loading = ref(false)

const handleSubmit = async (): Promise<void> => {
  error.value = null
  loading.value = true
  try {
    await authStore.resetPassword(email.value)
    submitted.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Anfrage fehlgeschlagen.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <template v-if="!submitted">
      <h1 class="text-xl font-bold text-gray-900 mb-2">Passwort zurücksetzen</h1>
      <p class="text-sm text-gray-500 mb-6">
        Wir senden dir einen Link per E-Mail, mit dem du ein neues Passwort setzen kannst.
      </p>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <FormField label="E-Mail" input-id="email">
          <TextInput
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="du@beispiel.de"
          />
        </FormField>

        <AlertMessage :message="error" />

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          {{ loading ? 'Wird gesendet …' : 'Link senden' }}
        </button>
      </form>
    </template>

    <AuthSuccessMessage v-else title="E-Mail gesendet">
      Bitte prüfe dein Postfach und klicke auf den Link.
    </AuthSuccessMessage>

    <p class="mt-5 text-sm text-center text-gray-500">
      <RouterLink :to="{ name: 'login' }" class="text-primary-600 hover:text-primary-700">
        ← Zurück zur Anmeldung
      </RouterLink>
    </p>
  </AuthLayout>
</template>
