<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppLogo from '@/components/AppLogo.vue'

const authStore = useAuthStore()

const email = ref('')
const submitted = ref(false)
const error = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit(): Promise<void> {
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
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
    <RouterLink
      :to="{ name: 'home' }"
      class="flex items-center gap-2 font-bold text-xl text-primary-700 mb-8"
    >
      <AppLogo class="w-8 h-8 text-primary-600" />
      Pflanzen.Gericht
    </RouterLink>

    <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <template v-if="!submitted">
        <h1 class="text-xl font-bold text-gray-900 mb-2">Passwort zurücksetzen</h1>
        <p class="text-sm text-gray-500 mb-6">
          Wir senden dir einen Link per E-Mail, mit dem du ein neues Passwort setzen kannst.
        </p>

        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5" for="email">
              E-Mail
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="du@beispiel.de"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div
            v-if="error"
            role="alert"
            class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
          >
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
          >
            {{ loading ? 'Wird gesendet …' : 'Link senden' }}
          </button>
        </form>
      </template>

      <template v-else>
        <div class="text-center py-4">
          <svg
            class="w-12 h-12 text-primary-500 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
          <p class="font-semibold text-gray-900 mb-1">E-Mail gesendet</p>
          <p class="text-sm text-gray-500">Bitte prüfe dein Postfach und klicke auf den Link.</p>
        </div>
      </template>

      <p class="mt-5 text-sm text-center text-gray-500">
        <RouterLink :to="{ name: 'login' }" class="text-primary-600 hover:text-primary-700">
          ← Zurück zur Anmeldung
        </RouterLink>
      </p>
    </div>
  </div>
</template>
