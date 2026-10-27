<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import dataSourceUrl from 'emoji-picker-element-data/de/cldr/data.json?url'

const SKIN_TONE_HIDING_STYLE = '.skintone-button-wrapper, .skintone-list { display: none; }'

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
  const style = document.createElement('style')
  style.textContent = SKIN_TONE_HIDING_STYLE
  picker.shadowRoot?.appendChild(style)
  picker.addEventListener('emoji-click', (event) => {
    const { unicode } = event.detail
    if (!unicode) return
    emit('pick', unicode)
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
