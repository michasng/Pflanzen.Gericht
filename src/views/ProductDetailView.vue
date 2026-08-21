<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="py-8 text-center text-gray-400">
    <p class="text-sm">
      Produkt <code class="font-mono">{{ route.params.id }}</code>
    </p>
    <p class="mt-1 text-xs">Wird in Phase 4 implementiert.</p>
  </div>
</template>
