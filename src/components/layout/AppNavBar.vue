<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const profileTo = computed(() => (authStore.isLoggedIn ? { name: 'profile' } : { name: 'login' }))
const profileLabel = computed(() => (authStore.isLoggedIn ? 'Profil' : 'Anmelden'))

function isActive(routeName: string): boolean {
  return route.name === routeName
}
</script>

<template>
  <!-- Mobile: fixierte Bottom-Navigation -->
  <nav
    class="md:hidden fixed bottom-0 inset-x-0 z-40 flex h-16 bg-white border-t border-gray-200 safe-area-inset-bottom"
    aria-label="Hauptnavigation"
  >
    <RouterLink
      :to="{ name: 'home' }"
      class="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors"
      :class="isActive('home') ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'"
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
      Entdecken
    </RouterLink>

    <!-- Zentraler Hinzufügen-Button -->
    <RouterLink
      :to="{ name: 'product-new' }"
      class="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors"
      :class="isActive('product-new') ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'"
    >
      <span
        class="flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 text-white -mt-6 shadow-lg shadow-primary-600/30"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </span>
      <span class="mt-1">Neu</span>
    </RouterLink>

    <RouterLink
      :to="profileTo"
      class="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors"
      :class="
        isActive('profile') || isActive('login')
          ? 'text-primary-600'
          : 'text-gray-500 hover:text-gray-700'
      "
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
      {{ profileLabel }}
    </RouterLink>
  </nav>

  <!-- Desktop: fixierte Top-Navigation -->
  <header
    class="hidden md:flex fixed top-0 inset-x-0 z-40 h-16 bg-white border-b border-gray-100 shadow-sm items-center px-6 gap-6"
    aria-label="Hauptnavigation"
  >
    <!-- Logo -->
    <RouterLink
      :to="{ name: 'home' }"
      class="flex items-center gap-2 font-bold text-lg text-primary-700 shrink-0 mr-4"
    >
      <svg
        class="w-7 h-7 text-primary-600"
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

    <!-- Nav-Links -->
    <nav class="flex items-center gap-1 text-sm font-medium flex-1">
      <RouterLink
        :to="{ name: 'home' }"
        class="px-3 py-1.5 rounded-lg transition-colors"
        :class="
          isActive('home')
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        "
      >
        Entdecken
      </RouterLink>
    </nav>

    <!-- Rechte Seite: Aktionen -->
    <div class="flex items-center gap-2 shrink-0">
      <RouterLink
        :to="{ name: 'product-new' }"
        class="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Produkt hinzufügen
      </RouterLink>

      <RouterLink
        :to="profileTo"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="
          isActive('profile') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
        "
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
        {{ profileLabel }}
      </RouterLink>
    </div>
  </header>
</template>
