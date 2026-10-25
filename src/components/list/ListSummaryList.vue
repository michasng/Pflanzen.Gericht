<script setup lang="ts">
import type { ListSummary } from '@/lib/ListSummary'
import EmptyState from '@/components/EmptyState.vue'
import LoadMoreButton from '@/components/LoadMoreButton.vue'
import ListSummaryCard from '@/components/list/ListSummaryCard.vue'

defineProps<{
  lists: ListSummary[]
  showVisibility: boolean
  hasMore: boolean
  loadingMore: boolean
  emptyTitle: string
}>()

defineEmits<{ loadMore: [] }>()
</script>

<template>
  <EmptyState v-if="lists.length === 0" compact :title="emptyTitle" />
  <ul v-else class="space-y-2">
    <li v-for="list in lists" :key="list.id">
      <ListSummaryCard :list="list" :showVisibility="showVisibility" />
    </li>
  </ul>
  <div v-if="hasMore" class="text-center">
    <LoadMoreButton
      ariaLabel="Mehr Listen laden"
      :loading="loadingMore"
      @click="$emit('loadMore')"
    />
  </div>
</template>
