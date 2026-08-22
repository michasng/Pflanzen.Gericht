<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isUsernameAvailable } from '@/services/profile'
import { slugifyUsername } from '@/lib/slug'
import AppLogo from '@/components/AppLogo.vue'

const router = useRouter()
const authStore = useAuthStore()

const displayName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const needsConfirmation = ref(false)

const usernameEdited = ref(false)
const usernameAvailable = ref<boolean | null>(null)
const usernameChecking = ref(false)

const USERNAME_RE = /^[a-z0-9_]{3,30}$/

watch(displayName, (val) => {
  if (usernameEdited.value) return
  username.value = slugifyUsername(val)
  usernameAvailable.value = null
})

let checkTimer: ReturnType<typeof setTimeout> | null = null

watch(username, (val) => {
  usernameAvailable.value = null
  if (!USERNAME_RE.test(val)) return
  if (checkTimer) clearTimeout(checkTimer)
  usernameChecking.value = true
  checkTimer = setTimeout(async () => {
    usernameAvailable.value = await isUsernameAvailable(val)
    usernameChecking.value = false
  }, 350)
})

const onUsernameInput = (): void => {
  usernameEdited.value = true
}

const usernameError = (): string | null => {
  if (!username.value) return null
  if (!USERNAME_RE.test(username.value)) return 'Nur Kleinbuchstaben, Ziffern und _ (3–30 Zeichen).'
  if (usernameAvailable.value === false) return 'Dieser Nutzername ist bereits vergeben.'
  return null
}

const handleSubmit = async (): Promise<void> => {
  error.value = null

  if (!USERNAME_RE.test(username.value)) {
    error.value = 'Ungültiger Nutzername.'
    return
  }
  if (usernameAvailable.value === false) {
    error.value = 'Dieser Nutzername ist bereits vergeben.'
    return
  }
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
    const data = await authStore.signUp(
      email.value,
      password.value,
      username.value,
      displayName.value.trim(),
    )
    if (data.session) {
      await router.push({ name: 'home' })
    } else {
      needsConfirmation.value = true
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen.'
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
      <template v-if="needsConfirmation">
        <div class="text-center py-4">
          <div
            class="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-gray-900 mb-2">Fast geschafft!</h1>
          <p class="text-sm text-gray-500 mb-6">
            Wir haben dir eine Bestätigungs-E-Mail an
            <strong class="text-gray-700">{{ email }}</strong> gesendet. Bitte klicke den Link in
            der E-Mail, um dein Konto zu aktivieren.
          </p>
          <RouterLink
            :to="{ name: 'login' }"
            class="inline-block w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Zur Anmeldung
          </RouterLink>
        </div>
      </template>

      <template v-else>
        <h1 class="text-xl font-bold text-gray-900 mb-6">Registrieren</h1>

        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5" for="displayName">
              Anzeigename
            </label>
            <input
              id="displayName"
              v-model="displayName"
              type="text"
              autocomplete="name"
              required
              maxlength="60"
              placeholder="z. B. Grüne Gabel"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5" for="username">
              Nutzername
            </label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none"
                aria-hidden="true"
                >@</span
              >
              <input
                id="username"
                v-model="username"
                type="text"
                autocomplete="username"
                required
                minlength="3"
                maxlength="30"
                placeholder="gruene_gabel"
                class="w-full pl-7 pr-8 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                :class="
                  usernameError()
                    ? 'border-red-300'
                    : usernameAvailable === true
                      ? 'border-green-400'
                      : 'border-gray-200'
                "
                @input="onUsernameInput"
              />
              <span
                v-if="usernameChecking"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                aria-live="polite"
                >…</span
              >
              <span
                v-else-if="usernameAvailable === true"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs"
                aria-live="polite"
                >✓</span
              >
            </div>
            <p v-if="usernameError()" class="mt-1 text-xs text-red-600" role="alert">
              {{ usernameError() }}
            </p>
          </div>

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
      </template>
    </div>
  </div>
</template>
