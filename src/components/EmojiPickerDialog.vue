<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import { CUSTOM_EMOJIS } from '@/config/customEmojis'
import { selectFirstNativeEmojiCategory } from '@/lib/selectFirstNativeEmojiCategory'
import dataSourceUrl from 'emoji-picker-element-data/de/cldr/data.json?url'

const CUSTOM_TAB_SELECTOR = '.nav-button[data-group-id="-1"]'
// The picker always renders the custom tab first. Reorder it visually and keep the indicator in sync.
const PICKER_STYLE = `
  .skintone-button-wrapper, .skintone-list { display: none; }
  ${CUSTOM_TAB_SELECTOR} { order: 1; }
  .nav:has(${CUSTOM_TAB_SELECTOR}) + .indicator-wrapper .indicator { translate: -100%; }
  .nav:has(${CUSTOM_TAB_SELECTOR}[aria-selected="true"]) + .indicator-wrapper .indicator {
    translate: calc((var(--num-groups) - 1) * 100%);
  }
`

const LIGHT_THEME_CLASS = 'light'

const emit = defineEmits<{ pick: [emoji: string]; close: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const pickerHost = useTemplateRef<HTMLDivElement>('pickerHost')

const closeOnBackdropClick = (event: MouseEvent): void => {
  if (event.target === dialog.value) dialog.value?.close()
}

onMounted(async () => {
  dialog.value?.showModal()
  const [{ Picker }, { default: german }] = await Promise.all([
    import('emoji-picker-element'),
    import('emoji-picker-element/i18n/de'),
  ])
  const picker = new Picker({ locale: 'de', dataSource: dataSourceUrl, i18n: german })
  picker.customEmoji = CUSTOM_EMOJIS.map(({ name, url }) => ({ name, shortcodes: [name], url }))
  picker.classList.add(LIGHT_THEME_CLASS)
  const style = document.createElement('style')
  style.textContent = PICKER_STYLE
  picker.shadowRoot?.appendChild(style)
  if (picker.shadowRoot) selectFirstNativeEmojiCategory(picker.shadowRoot)
  picker.addEventListener('emoji-click', (event) => {
    const { unicode, emoji } = event.detail
    const picked = unicode ?? ('name' in emoji ? emoji.name : undefined)
    if (!picked) return
    emit('pick', picked)
    dialog.value?.close()
  })
  pickerHost.value?.replaceChildren(picker)
})
</script>

<template>
  <dialog
    ref="dialog"
    aria-label="Emoji auswählen"
    class="picker-dialog m-auto rounded-xl border border-gray-200 bg-white p-0 shadow-xl backdrop:bg-black/40"
    @close="emit('close')"
    @click="closeOnBackdropClick"
  >
    <div ref="pickerHost" />
  </dialog>
</template>

<style scoped>
.picker-dialog {
  --background: var(--color-white);
  --border-color: var(--color-gray-200);
  --input-border-color: var(--color-gray-200);
  --input-font-color: var(--color-gray-900);
  --indicator-color: var(--color-primary-600);
  --button-hover-background: var(--color-primary-50);
  --button-active-background: var(--color-primary-100);
}
</style>
