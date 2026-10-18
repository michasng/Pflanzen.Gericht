<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAsyncData } from '@/composables/useAsyncData'
import { useImageUpload } from '@/composables/useImageUpload'
import { injectGateway } from '@/composables/injectGateway'
import { reviewEditingGatewayKey } from '@/services/reviewEditingGatewayKey'
import { useSubmit } from '@/composables/useSubmit'
import ReviewForm from '@/components/ReviewForm.vue'
import ReviewFormHeading from '@/components/ReviewFormHeading.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import type { ReviewFormValues } from '@/components/ReviewForm.vue'
import type { ReviewWithDetails } from '@/services/reviews'
import type { Product, ProductImage, ReviewImage } from '@/types'

interface ReviewEditData {
  review: ReviewWithDetails
  product: Product
  productImages: ProductImage[]
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const reviewEditingGateway = injectGateway(reviewEditingGatewayKey)

const { pendingFiles, selectCopies, existingImages, handleDeleteImage, commitImageChanges } =
  useImageUpload<ReviewImage, ProductImage>(
    (file, sortOrder) => {
      if (!editData.value || !authStore.user) return Promise.resolve()
      return reviewEditingGateway.uploadReviewImage(
        editData.value.review.id,
        authStore.user.id,
        file,
        sortOrder,
      )
    },
    (image) => reviewEditingGateway.deleteReviewImage(image.id, image.storagePath),
    (productImage, sortOrder) => {
      if (!editData.value || !authStore.user) return Promise.resolve()
      return reviewEditingGateway.copyProductImageToReview(
        productImage,
        editData.value.review.id,
        authStore.user.id,
        sortOrder,
      )
    },
  )

const loadReviewEditData = async (reviewId: string): Promise<ReviewEditData | null> => {
  const review = await reviewEditingGateway.fetchReviewForEdit(reviewId)
  if (!review) throw new Error('Bewertung nicht gefunden.')
  if (review.userId !== authStore.user?.id && !authStore.isAdmin) {
    await router.replace({ name: 'product-detail', params: { id: review.productId } })
    return null
  }
  const [product, productImages] = await Promise.all([
    reviewEditingGateway.fetchProduct(review.productId),
    authStore.isAdmin
      ? reviewEditingGateway.fetchProductImages(review.productId)
      : Promise.resolve([]),
  ])
  if (!product) throw new Error('Produkt nicht gefunden.')
  existingImages.value = [...review.images].sort((a, b) => a.sortOrder - b.sortOrder)
  return { review, product, productImages }
}

const {
  data: editData,
  loading,
  errorMessage: loadError,
} = useAsyncData(loadReviewEditData, () => String(route.params.reviewId))

const imageCopySources = computed(() =>
  authStore.isAdmin && editData.value?.productImages.length
    ? [{ label: 'Produkt', images: editData.value.productImages }]
    : [],
)

const handleCopySelectionChanged = (imageIds: string[]): void => {
  selectCopies((editData.value?.productImages ?? []).filter((image) => imageIds.includes(image.id)))
}

const {
  submitting,
  errorMessage: submitError,
  submit,
} = useSubmit(async (values: ReviewFormValues): Promise<void> => {
  if (!editData.value || !authStore.user) return
  const { tags, ...fields } = values
  await reviewEditingGateway.updateReview(editData.value.review.id, fields, tags)
  await commitImageChanges()
  await router.push({ name: 'product-detail', params: { id: editData.value.review.productId } })
})
</script>

<template>
  <div class="max-w-lg mx-auto">
    <LoadingText v-if="loading" />
    <AlertMessage v-else-if="loadError" :message="loadError" />
    <template v-else-if="editData">
      <ReviewFormHeading
        label="Bewertung bearbeiten für"
        :product-name="editData.product.name"
        :brand="editData.product.brand"
      />

      <AlertMessage :message="submitError" class="mb-4" />

      <ReviewForm
        :initial="{
          overall: editData.review.overall,
          taste: editData.review.taste,
          consistency: editData.review.consistency,
          appearance: editData.review.appearance,
          nutrition: editData.review.nutrition,
          value: editData.review.value,
          comment: editData.review.comment,
          tags: editData.review.tags,
        }"
        :existing-images="existingImages"
        :submitting="submitting"
        :image-copy-sources="imageCopySources"
        @submit="submit"
        @files-changed="pendingFiles = $event"
        @delete-image="handleDeleteImage"
        @copy-selection-changed="handleCopySelectionChanged"
      />
    </template>
  </div>
</template>
