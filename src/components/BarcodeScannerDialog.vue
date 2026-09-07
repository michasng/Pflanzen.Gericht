<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBarcodeScanner, type BarcodeReader } from '@/composables/useBarcodeScanner'
import { createZxingBarcodeReader } from '@/lib/createZxingBarcodeReader'
import { toErrorMessage } from '@/lib/error'

const props = withDefaults(defineProps<{ createReader?: () => BarcodeReader }>(), {
  createReader: createZxingBarcodeReader,
})

const emit = defineEmits<{ decoded: [barcode: string]; cancel: [] }>()

const videoElement = ref<HTMLVideoElement | null>(null)
const cameraErrorMessage = ref<string | null>(null)

const { frameErrorMessage, startScanning, stopScanning } = useBarcodeScanner(props.createReader())

onMounted(async () => {
  if (!videoElement.value) return
  try {
    const barcode = await startScanning(videoElement.value)
    emit('decoded', barcode)
  } catch (err) {
    cameraErrorMessage.value = toErrorMessage(err)
  }
})

onUnmounted(stopScanning)

const handleCancel = (): void => {
  stopScanning()
  emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Barcode scannen"
      class="fixed inset-0 z-50 flex flex-col bg-black"
    >
      <video
        ref="videoElement"
        class="flex-1 w-full h-full object-cover"
        muted
        playsinline
        aria-hidden="true"
      ></video>

      <div
        v-if="!cameraErrorMessage"
        class="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-8 aspect-[3/2] border-2 border-white/70 rounded-lg pointer-events-none"
        aria-hidden="true"
      ></div>

      <p
        v-if="frameErrorMessage"
        role="alert"
        class="absolute top-4 inset-x-4 text-center text-sm text-white bg-black/60 rounded-lg px-3 py-2"
      >
        {{ frameErrorMessage }}
      </p>

      <p
        v-if="cameraErrorMessage"
        role="alert"
        class="absolute top-1/2 -translate-y-1/2 inset-x-4 text-center text-sm text-white bg-black/60 rounded-lg px-3 py-2"
      >
        {{ cameraErrorMessage }}
      </p>

      <div class="absolute bottom-0 inset-x-0 p-4 pb-safe-or-6">
        <button
          type="button"
          class="w-full py-3 bg-white text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
          @click="handleCancel"
        >
          Abbrechen
        </button>
      </div>
    </div>
  </Teleport>
</template>
