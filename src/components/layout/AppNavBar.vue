<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLogo from '@/components/AppLogo.vue'

const route = useRoute()
const authStore = useAuthStore()

const profileTo = computed(() => (authStore.isLoggedIn ? { name: 'profile' } : { name: 'login' }))
const profileLabel = computed(() => (authStore.isLoggedIn ? 'Profil' : 'Anmelden'))

const createMenuOpen = ref(false)

watch(
  () => route.name,
  () => {
    createMenuOpen.value = false
  },
)

function isActive(routeName: string): boolean {
  return route.name === routeName
}
</script>

<template>
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

    <RouterLink
      v-if="!authStore.isAdmin"
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

    <button
      v-else
      type="button"
      class="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors"
      :class="
        isActive('product-new') || isActive('admin')
          ? 'text-primary-600'
          : 'text-gray-500 hover:text-gray-700'
      "
      :aria-expanded="createMenuOpen"
      aria-haspopup="true"
      aria-label="Aktionen"
      @click="createMenuOpen = !createMenuOpen"
    >
      <span
        class="flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 text-white -mt-6 shadow-lg shadow-primary-600/30"
      >
        <svg
          class="w-6 h-6 transition-transform"
          :class="{ 'rotate-45': createMenuOpen }"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </span>
      <span class="mt-1">Mehr</span>
    </button>

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

  <Teleport to="body">
    <div v-if="createMenuOpen" class="md:hidden">
      <button
        type="button"
        class="fixed inset-0 z-40 bg-black/20"
        aria-label="Menü schließen"
        @click="createMenuOpen = false"
      ></button>

      <div
        class="fixed bottom-20 left-1/2 z-50 flex w-52 -translate-x-1/2 flex-col gap-1 rounded-xl bg-white p-2 shadow-xl ring-1 ring-gray-200"
        role="menu"
      >
        <RouterLink
          :to="{ name: 'product-new' }"
          role="menuitem"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg
            class="h-5 w-5 text-primary-600"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Produkt hinzufügen
        </RouterLink>

        <RouterLink
          :to="{ name: 'admin' }"
          role="menuitem"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg
            class="h-5 w-5 text-primary-600"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
            />
          </svg>
          Admin
        </RouterLink>
      </div>
    </div>
  </Teleport>

  <header
    class="hidden md:flex fixed top-0 inset-x-0 z-40 h-16 bg-white border-b border-gray-100 shadow-sm items-center px-6 gap-6"
    aria-label="Hauptnavigation"
  >
    <RouterLink
      :to="{ name: 'home' }"
      class="flex items-center gap-2 font-bold text-lg text-primary-700 shrink-0 mr-4"
    >
      <AppLogo class="w-7 h-7 text-primary-600" />
      Pflanzen.Gericht
    </RouterLink>

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
      <RouterLink
        v-if="authStore.isAdmin"
        :to="{ name: 'admin' }"
        class="px-3 py-1.5 rounded-lg transition-colors"
        :class="
          isActive('admin')
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        "
      >
        Admin
      </RouterLink>
    </nav>

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
