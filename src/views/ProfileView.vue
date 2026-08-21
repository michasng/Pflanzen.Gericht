<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="py-8 text-center text-gray-400">
    <p class="font-medium text-gray-600">Mein Profil</p>
    <p class="mt-1 text-sm">{{ authStore.user?.email }}</p>
    <p class="mt-1 text-xs">Wird in Phase 7 implementiert.</p>
  </div>
</template>
