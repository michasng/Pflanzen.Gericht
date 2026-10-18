<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AlertMessage from '@/components/AlertMessage.vue'
import AuthLayout from '@/components/AuthLayout.vue'
import FormField from '@/components/primitives/FormField.vue'
import TextInput from '@/components/primitives/TextInput.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

const handleSubmit = async (): Promise<void> => {
  error.value = null
  loading.value = true
  try {
    await authStore.signIn(email.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="text-xl font-bold text-gray-900 mb-6">Anmelden</h1>

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

      <FormField label="Passwort" input-id="password">
        <TextInput
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </FormField>

      <AlertMessage :message="error" />

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
      >
        {{ loading ? 'Wird angemeldet …' : 'Anmelden' }}
      </button>
    </form>

    <div class="mt-5 flex flex-col gap-2 text-sm text-center text-gray-500">
      <RouterLink
        :to="{ name: 'password-forgot' }"
        class="hover:text-primary-600 transition-colors"
      >
        Passwort vergessen?
      </RouterLink>
      <span>
        Noch kein Konto?
        <RouterLink
          :to="{ name: 'register' }"
          class="text-primary-600 font-medium hover:text-primary-700"
        >
          Registrieren
        </RouterLink>
      </span>
    </div>
  </AuthLayout>
</template>
