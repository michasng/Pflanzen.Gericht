<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { slugifyUsername } from '@/lib/slug'
import { PASSWORD_MIN_LENGTH, validateNewPassword } from '@/lib/validateNewPassword'
import { USERNAME_FORMAT_PATTERN } from '@/composables/useUsernameAvailability'
import AlertMessage from '@/components/AlertMessage.vue'
import AuthLayout from '@/components/AuthLayout.vue'
import AuthSuccessMessage from '@/components/AuthSuccessMessage.vue'
import UsernameField from '@/components/UsernameField.vue'
import FormField from '@/components/primitives/FormField.vue'
import TextInput from '@/components/primitives/TextInput.vue'

const DISPLAY_NAME_MAX_LENGTH = 60

const router = useRouter()
const authStore = useAuthStore()

const displayName = ref('')
const username = ref('')
const usernameAvailable = ref<boolean | null>(null)
const usernameEdited = ref(false)
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const needsConfirmation = ref(false)

watch(displayName, (value) => {
  if (usernameEdited.value) return
  username.value = slugifyUsername(value)
})

const handleSubmit = async (): Promise<void> => {
  error.value = null

  if (!USERNAME_FORMAT_PATTERN.test(username.value)) {
    error.value = 'Ungültiger Nutzername.'
    return
  }
  if (usernameAvailable.value === false) {
    error.value = 'Dieser Nutzername ist bereits vergeben.'
    return
  }
  error.value = validateNewPassword(password.value, passwordConfirm.value) ?? null
  if (error.value) return

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
  <AuthLayout>
    <AuthSuccessMessage v-if="needsConfirmation" title="Fast geschafft!">
      Wir haben dir eine Bestätigungs-E-Mail an
      <strong class="text-gray-700">{{ email }}</strong> gesendet. Bitte klicke den Link in der
      E-Mail, um dein Konto zu aktivieren.
      <template #action>
        <RouterLink
          :to="{ name: 'login' }"
          class="inline-block w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          Zur Anmeldung
        </RouterLink>
      </template>
    </AuthSuccessMessage>

    <template v-else>
      <h1 class="text-xl font-bold text-gray-900 mb-6">Registrieren</h1>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <FormField label="Anzeigename" input-id="displayName">
          <TextInput
            id="displayName"
            v-model="displayName"
            autocomplete="name"
            required
            :maxlength="DISPLAY_NAME_MAX_LENGTH"
            placeholder="z. B. Grüne Gabel"
          />
        </FormField>

        <UsernameField
          v-model="username"
          v-model:available="usernameAvailable"
          @edit="usernameEdited = true"
        />

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
  </AuthLayout>
</template>
