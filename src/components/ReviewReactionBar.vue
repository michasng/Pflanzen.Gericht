<script setup lang="ts">
import { computed, ref } from 'vue'
import AlertMessage from '@/components/AlertMessage.vue'
import EmojiPickerDialog from '@/components/EmojiPickerDialog.vue'
import ReviewReactionChip from '@/components/ReviewReactionChip.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { QUICK_REACTION_EMOJIS, VISIBLE_EXTRA_REACTION_LIMIT } from '@/config/reactions'
import { injectGateway } from '@/composables/injectGateway'
import { useReviewReactions } from '@/composables/useReviewReactions'
import { arrangeReactionChips } from '@/lib/arrangeReactionChips'
import { productDetailGatewayKey } from '@/services/ProductDetailGateway'
import type { ReviewReaction } from '@/types/ReviewReaction'

const props = defineProps<{
  reviewId: string
  initialReactions: readonly ReviewReaction[]
  currentUserId: string | null
  currentUserProfile: ReviewReaction['profile'] | null
}>()

const { reactions, pendingEmojis, errorMessage, toggle } = useReviewReactions({
  gateway: injectGateway(productDetailGatewayKey),
  reviewId: props.reviewId,
  currentUserId: () => props.currentUserId,
  currentUserProfile: () => props.currentUserProfile,
  initialReactions: props.initialReactions,
})

const isExpanded = ref(false)
const isPickerOpen = ref(false)

const isSignedIn = computed(() => props.currentUserId !== null && props.currentUserProfile !== null)
const arrangedChips = computed(() =>
  arrangeReactionChips({
    reactions: reactions.value,
    currentUserId: props.currentUserId,
    quickEmojis: QUICK_REACTION_EMOJIS,
    visibleExtraLimit: VISIBLE_EXTRA_REACTION_LIMIT,
  }),
)
const shownChips = computed(() =>
  isExpanded.value
    ? [...arrangedChips.value.visibleChips, ...arrangedChips.value.hiddenChips]
    : arrangedChips.value.visibleChips,
)
const hiddenCount = computed(() => arrangedChips.value.hiddenChips.length)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-1.5">
      <ReviewReactionChip
        v-for="chip in shownChips"
        :key="chip.emoji"
        :chip="chip"
        :interactive="isSignedIn"
        :disabled="pendingEmojis.includes(chip.emoji)"
        @toggle="toggle(chip.emoji)"
      />
      <Button
        v-if="!isExpanded && hiddenCount > 0"
        :variant="ButtonVariant.Text"
        :size="ButtonSize.Small"
        :ariaLabel="`${hiddenCount} weitere Reaktionen anzeigen`"
        @click="isExpanded = true"
      >
        +{{ hiddenCount }}
      </Button>
      <Button
        v-if="isSignedIn"
        :variant="ButtonVariant.Icon"
        ariaLabel="Emoji auswählen"
        @click="isPickerOpen = true"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path stroke-linecap="round" d="M8.5 14.5a4.5 4.5 0 007 0M9 9.5h.01M15 9.5h.01" />
        </svg>
      </Button>
    </div>
    <AlertMessage class="mt-2" :message="errorMessage" />
    <EmojiPickerDialog v-if="isPickerOpen" @pick="toggle" @close="isPickerOpen = false" />
  </div>
</template>
