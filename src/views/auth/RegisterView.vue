<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit(): Promise<void> {
  error.value = null

  if (password.value !== passwordConfirm.value) {
    error.value = 'Passwörter stimmen nicht überein.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'Das Passwort muss mindestens 8 Zeichen lang sein.'
    return
  }

  loading.value = true
  try {
    await authStore.signUp(email.value, password.value, username.value)
    await router.push({ name: 'home' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
    <!-- Logo -->
    <RouterLink
      :to="{ name: 'home' }"
      class="flex items-center gap-2 font-bold text-xl text-primary-700 mb-8"
    >
      <svg
        class="w-8 h-8 text-primary-600"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20c6 0 7-8 7-8 3 3 3 8 2 11h2c1-6-1-11-2-15z"
        />
      </svg>
      Pflanzen.Gericht
    </RouterLink>

    <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h1 class="text-xl font-bold text-gray-900 mb-6">Registrieren</h1>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5" for="username">
            Nutzername
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            required
            minlength="3"
            maxlength="30"
            placeholder="z. B. gruene_gabel"
            class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5" for="email"> E-Mail </label>
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

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5" for="password">
            Passwort
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5" for="password-confirm">
            Passwort bestätigen
          </label>
          <input
            id="password-confirm"
            v-model="passwordConfirm"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
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
          {{ loading ? 'Wird registriert …' : 'Konto erstellen' }}
        </button>
      </form>

      <p class="mt-5 text-sm text-center text-gray-500">
        Bereits ein Konto?
        <RouterLink
          :to="{ name: 'login' }"
          class="text-primary-600 font-medium hover:text-primary-700"
        >
          Anmelden
        </RouterLink>
      </p>
    </div>
  </div>
</template>
