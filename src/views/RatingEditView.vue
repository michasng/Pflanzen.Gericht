<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchProduct } from '@/services/products'
import {
  fetchRatingForEdit,
  updateRating,
  uploadRatingImage,
  deleteRatingImage,
} from '@/services/ratings'
import { toErrorMessage } from '@/lib/error'
import { useImageUpload } from '@/composables/useImageUpload'
import RatingForm from '@/components/RatingForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import type { RatingFormValues } from '@/components/RatingForm.vue'
import type { Product, Rating, RatingImage } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

type RatingWithMeta = Rating & { tags: string[]; images: RatingImage[] }

const rating = ref<RatingWithMeta | null>(null)
const product = ref<Product | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const { pendingFiles, existingImages, handleDeleteImage, commitImageChanges } =
  useImageUpload<RatingImage>(
    (file, sortOrder) => uploadRatingImage(rating.value!.id, authStore.user!.id, file, sortOrder),
    (img) => deleteRatingImage(img.id, img.storage_path),
  )

onMounted(async () => {
  const ratingId = route.params.ratingId as string
  try {
    const r = await fetchRatingForEdit(ratingId)
    if (!r) {
      loadError.value = 'Bewertung nicht gefunden.'
      return
    }
    if (r.user_id !== authStore.user?.id && !authStore.isAdmin) {
      await router.replace({ name: 'product-detail', params: { id: r.product_id } })
      return
    }
    const p = await fetchProduct(r.product_id)
    if (!p) {
      loadError.value = 'Produkt nicht gefunden.'
      return
    }
    rating.value = r
    product.value = p
    existingImages.value = [...r.images].sort((a, b) => a.sort_order - b.sort_order)
  } catch (err) {
    loadError.value = toErrorMessage(err)
  } finally {
    loading.value = false
  }
})

async function handleSubmit(values: RatingFormValues): Promise<void> {
  if (!rating.value || !authStore.user) return
  submitting.value = true
  submitError.value = null
  try {
    const { tags, ...fields } = values
    await updateRating(rating.value.id, fields, tags)
    await commitImageChanges()
    await router.push({ name: 'product-detail', params: { id: rating.value.product_id } })
  } catch (err) {
    submitError.value = toErrorMessage(err)
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <LoadingText v-if="loading" />
    <AlertMessage v-else-if="loadError" :message="loadError" />
    <template v-else-if="rating && product">
      <div class="mb-6">
        <p class="text-sm text-gray-500 mb-1">Bewertung bearbeiten für</p>
        <h1 class="text-xl font-bold text-gray-900 leading-tight">{{ product.name }}</h1>
        <p v-if="product.brand" class="text-sm text-gray-500 mt-0.5">{{ product.brand }}</p>
      </div>

      <AlertMessage :message="submitError" class="mb-4" />

      <RatingForm
        :initial="{
          overall: rating.overall,
          taste: rating.taste,
          consistency: rating.consistency,
          appearance: rating.appearance,
          nutrition: rating.nutrition,
          value: rating.value,
          comment: rating.comment,
          tags: rating.tags,
        }"
        :existing-images="existingImages"
        :submitting="submitting"
        @submit="handleSubmit"
        @files-changed="pendingFiles = $event"
        @delete-image="handleDeleteImage"
      />
    </template>
  </div>
</template>
