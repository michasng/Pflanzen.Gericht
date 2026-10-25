<script setup lang="ts">
import type { ListSummary } from '@/lib/ListSummary'
import { formatCountWithNoun } from '@/lib/formatCountWithNoun'
import BookmarkIcon from '@/components/BookmarkIcon.vue'
import CoverImage from '@/components/CoverImage.vue'
import Card from '@/components/primitives/CardComponent.vue'
import ListVisibilityBadge from '@/components/list/ListVisibilityBadge.vue'

defineProps<{ list: ListSummary; showVisibility: boolean }>()
</script>

<template>
  <Card>
    <div class="flex items-center gap-3">
      <CoverImage :source="list.coverImage" :alt="list.name">
        <BookmarkIcon />
      </CoverImage>
      <div class="min-w-0 flex-1">
        <RouterLink
          :to="{ name: 'list', params: { id: list.id } }"
          class="block truncate font-semibold text-gray-900 hover:text-primary-600 transition-colors"
        >
          {{ list.name }}
        </RouterLink>
        <p class="mt-0.5 text-sm text-gray-500">
          {{ formatCountWithNoun(list.productCount, 'Produkt', 'Produkte') }}
        </p>
      </div>
      <ListVisibilityBadge v-if="showVisibility" :visibility="list.visibility" />
    </div>
  </Card>
</template>
