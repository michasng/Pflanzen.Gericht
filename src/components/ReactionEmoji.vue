<script setup lang="ts">
import { computed } from 'vue'
import { CUSTOM_EMOJIS } from '@/config/customEmojis'
import { findCustomEmoji } from '@/lib/findCustomEmoji'

const props = defineProps<{ emoji: string }>()

const customEmoji = computed(() => findCustomEmoji(props.emoji, CUSTOM_EMOJIS))
</script>

<template>
  <!-- match native emoji size as much as possible -->
  <img
    v-if="customEmoji"
    :src="customEmoji.url"
    alt=""
    class="my-[calc((1lh-1.373em)/2)] block h-[1.373em] w-[1.373em] translate-y-[0.052em] p-[0.1294em]"
  />
  <template v-else>{{ emoji }}</template>
</template>
