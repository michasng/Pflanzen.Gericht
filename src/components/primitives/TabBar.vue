<script setup lang="ts" generic="Value extends string">
import TabButton from '@/components/primitives/TabButton.vue'
import type { TabBarItem } from '@/components/primitives/TabBarItem'

const props = defineProps<{ tabs: TabBarItem<Value>[] }>()

const model = defineModel<Value>({ required: true })

const getTargetIndex = (key: string, currentIndex: number): number | null => {
  const lastIndex = props.tabs.length - 1
  if (key === 'ArrowRight') return currentIndex === lastIndex ? 0 : currentIndex + 1
  if (key === 'ArrowLeft') return currentIndex === 0 ? lastIndex : currentIndex - 1
  if (key === 'Home') return 0
  if (key === 'End') return lastIndex
  return null
}

const handleKeydown = (event: KeyboardEvent): void => {
  const tabList = event.currentTarget
  if (!(tabList instanceof HTMLElement)) return
  const currentIndex = props.tabs.findIndex((tab) => tab.value === model.value)
  const targetIndex = getTargetIndex(event.key, currentIndex)
  if (targetIndex === null) return
  const targetTab = props.tabs[targetIndex]
  if (!targetTab) return

  event.preventDefault()
  model.value = targetTab.value
  tabList.querySelectorAll<HTMLElement>('[role="tab"]')[targetIndex]?.focus()
}
</script>

<template>
  <div role="tablist" class="flex border-b border-gray-200" @keydown="handleKeydown">
    <TabButton
      v-for="tab in tabs"
      :key="tab.value"
      :ariaLabel="tab.ariaLabel"
      :active="tab.value === model"
      :tabindex="tab.value === model ? 0 : -1"
      @click="model = tab.value"
    >
      {{ tab.label }}
    </TabButton>
  </div>
</template>
