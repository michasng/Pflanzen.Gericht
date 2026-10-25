<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { ListSummary } from '@/lib/ListSummary'
import BookmarkIcon from '@/components/BookmarkIcon.vue'
import ListVisibilityBadge from '@/components/list/ListVisibilityBadge.vue'

defineProps<{
  list: ListSummary
  ownerName: string
  ownerRoute: RouteLocationRaw
  showVisibility: boolean
}>()
</script>

<template>
  <header class="flex items-center gap-3 pt-2">
    <span
      class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700"
    >
      <BookmarkIcon />
    </span>
    <div class="min-w-0">
      <h1 class="truncate text-lg font-bold leading-tight text-gray-900">{{ list.name }}</h1>
      <p class="mt-0.5 text-sm text-gray-500">
        von
        <RouterLink :to="ownerRoute" class="hover:text-primary-600 transition-colors">
          {{ ownerName }}
        </RouterLink>
      </p>
      <ListVisibilityBadge v-if="showVisibility" :visibility="list.visibility" class="mt-1" />
    </div>
  </header>
</template>
