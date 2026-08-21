<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLogo from '@/components/AppLogo.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit(): Promise<void> {
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
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
    <RouterLink
      :to="{ name: 'home' }"
      class="flex items-center gap-2 font-bold text-xl text-primary-700 mb-8"
    >
      <AppLogo class="w-8 h-8 text-primary-600" />
      Pflanzen.Gericht
    </RouterLink>

    <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h1 class="text-xl font-bold text-gray-900 mb-6">Anmelden</h1>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
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
            autocomplete="current-password"
            required
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
    </div>
  </div>
</template>
