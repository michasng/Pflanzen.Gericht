<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLogo from '@/components/AppLogo.vue'

const router = useRouter()
const authStore = useAuthStore()

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
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
    <RouterLink
      :to="{ name: 'home' }"
      class="flex items-center gap-2 font-bold text-xl text-primary-700 mb-8"
    >
      <AppLogo class="w-8 h-8 text-primary-600" />
      Pflanzen.Gericht
    </RouterLink>

    <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h1 class="text-xl font-bold text-gray-900 mb-6">Neues Passwort setzen</h1>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5" for="password">
            Neues Passwort
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
          {{ loading ? 'Wird gespeichert …' : 'Passwort speichern' }}
        </button>
      </form>
    </div>
  </div>
</template>
