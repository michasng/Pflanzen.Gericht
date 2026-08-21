<script setup lang="ts">
import AppNavBar from './AppNavBar.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <AppNavBar />
    <main class="flex-1 pb-20 md:pt-16 md:pb-0">
      <div class="max-w-screen-xl mx-auto w-full px-4 py-4">
        <RouterView />
      </div>
    </main>
  </div>
</template>
