<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const MAX_DIMENSION = 1280
const MAX_FILES = 5
const WEBP_QUALITY = 0.85

interface Preview {
  url: string
  file: File
}

const emit = defineEmits<{ change: [files: File[]] }>()

const previews = ref<Preview[]>([])
const processing = ref(false)
const error = ref<string | null>(null)
const dragOver = ref(false)

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img
      const ratio = Math.min(1, MAX_DIMENSION / Math.max(width, height))
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas nicht unterstützt.'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Komprimierung fehlgeschlagen.'))
            return
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
        },
        'image/webp',
        WEBP_QUALITY,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Bild ungültig.'))
    }
    img.src = objectUrl
  })
}

async function addFiles(fileList: FileList | null): Promise<void> {
  if (!fileList || processing.value) return
  error.value = null
  const slots = MAX_FILES - previews.value.length
  if (slots <= 0) {
    error.value = `Maximal ${MAX_FILES} Bilder erlaubt.`
    return
  }
  processing.value = true
  const incoming = Array.from(fileList)
    .filter((f) => f.type.startsWith('image/'))
    .slice(0, slots)
  for (const raw of incoming) {
    try {
      const compressed = await compressImage(raw)
      previews.value.push({ url: URL.createObjectURL(compressed), file: compressed })
    } catch {
      error.value = 'Ein Bild konnte nicht verarbeitet werden.'
    }
  }
  processing.value = false
  emit(
    'change',
    previews.value.map((p) => p.file),
  )
}

function remove(index: number): void {
  const preview = previews.value[index]
  if (preview) URL.revokeObjectURL(preview.url)
  previews.value.splice(index, 1)
  emit(
    'change',
    previews.value.map((p) => p.file),
  )
}

function onInput(event: Event): void {
  const input = event.target as HTMLInputElement
  void addFiles(input.files)
  input.value = ''
}

function onDrop(event: DragEvent): void {
  dragOver.value = false
  void addFiles(event.dataTransfer?.files ?? null)
}

onUnmounted(() => {
  previews.value.forEach((p) => URL.revokeObjectURL(p.url))
})
</script>

<template>
  <div class="space-y-3">
    <div v-if="previews.length" class="grid grid-cols-3 gap-2">
      <div
        v-for="(preview, i) in previews"
        :key="preview.url"
        class="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
      >
        <img :src="preview.url" alt="" class="w-full h-full object-cover" />
        <button
          type="button"
          class="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
          :aria-label="`Bild ${i + 1} entfernen`"
          @click="remove(i)"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <label
      v-if="previews.length < MAX_FILES"
      class="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors"
      :class="
        dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
      "
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
    >
      <svg
        class="w-8 h-8 text-gray-300"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm4.5 4.5h-15a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25z"
        />
      </svg>
      <span class="text-sm text-gray-500">
        {{ processing ? 'Wird verarbeitet …' : 'Bilder auswählen oder hierher ziehen' }}
      </span>
      <span class="text-xs text-gray-400">bis zu {{ MAX_FILES }} Bilder · wird komprimiert</span>
      <input
        type="file"
        accept="image/*"
        multiple
        class="sr-only"
        :disabled="processing"
        @change="onInput"
      />
    </label>

    <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
