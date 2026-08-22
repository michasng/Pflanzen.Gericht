<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchProduct } from '@/services/products'
import { createRating, uploadRatingImage } from '@/services/ratings'
import { toErrorMessage } from '@/lib/error'
import RatingForm from '@/components/RatingForm.vue'
import type { RatingFormValues } from '@/components/RatingForm.vue'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const product = ref<Product | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const pendingFiles = ref<File[]>([])

onMounted(async () => {
  try {
    product.value = await fetchProduct(route.params.id as string)
    if (!product.value) loadError.value = 'Produkt nicht gefunden.'
  } catch (err) {
    loadError.value = toErrorMessage(err)
  } finally {
    loading.value = false
  }
})

async function handleSubmit(values: RatingFormValues): Promise<void> {
  const user = authStore.user
  if (!product.value || !user) return
  submitting.value = true
  submitError.value = null
  try {
    const { tags, ...fields } = values
    const rating = await createRating(product.value.id, user.id, fields, tags)
    await Promise.all(
      pendingFiles.value.map((file, i) => uploadRatingImage(rating.id, user.id, file, i)),
    )
    await router.push({ name: 'product-detail', params: { id: product.value.id } })
  } catch (err) {
    submitError.value = toErrorMessage(err)
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <div v-if="loading" class="py-12 text-center text-gray-400 text-sm">Wird geladen …</div>
    <div
      v-else-if="loadError"
      role="alert"
      class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
    >
      {{ loadError }}
    </div>
    <template v-else-if="product">
      <div class="mb-6">
        <p class="text-sm text-gray-500 mb-1">Bewertung für</p>
        <h1 class="text-xl font-bold text-gray-900 leading-tight">{{ product.name }}</h1>
        <p v-if="product.brand" class="text-sm text-gray-500 mt-0.5">{{ product.brand }}</p>
      </div>

      <div
        v-if="submitError"
        role="alert"
        class="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
      >
        {{ submitError }}
      </div>

      <RatingForm
        :submitting="submitting"
        @submit="handleSubmit"
        @files-changed="pendingFiles = $event"
      />
    </template>
  </div>
</template>
