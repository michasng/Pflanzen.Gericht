<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ProductForm from '@/components/ProductForm.vue'
import { createProduct, uploadProductImage } from '@/services/products'
import { toErrorMessage } from '@/lib/error'
import type { ProductFormValues } from '@/components/ProductForm.vue'

const router = useRouter()
const authStore = useAuthStore()

const submitting = ref(false)
const error = ref<string | null>(null)
const pendingFiles = ref<File[]>([])

async function handleSubmit(values: ProductFormValues): Promise<void> {
  if (!authStore.user) return
  submitting.value = true
  error.value = null
  try {
    const product = await createProduct(values, authStore.user.id)
    for (const [i, file] of pendingFiles.value.entries()) {
      await uploadProductImage(product.id, authStore.user.id, file, i)
    }
    await router.push({ name: 'product-detail', params: { id: product.id } })
  } catch (err) {
    error.value = toErrorMessage(err)
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-xl font-bold text-gray-900 mb-6">Produkt hinzufügen</h1>

    <div
      v-if="error"
      role="alert"
      class="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
    >
      {{ error }}
    </div>

    <ProductForm
      :submitting="submitting"
      @submit="handleSubmit"
      @files-changed="pendingFiles = $event"
    />
  </div>
</template>
