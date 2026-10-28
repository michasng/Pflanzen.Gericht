<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAsyncData } from '@/composables/useAsyncData'
import { injectGateway } from '@/composables/injectGateway'
import { CELEBRATION_QUERY_KEY } from '@/lib/celebrationQueryKey'
import { reviewEditingGatewayKey } from '@/services/ReviewEditingGateway'
import { useSubmit } from '@/composables/useSubmit'
import ReviewForm from '@/components/ReviewForm.vue'
import ReviewFormHeading from '@/components/ReviewFormHeading.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import type { ReviewFormValues } from '@/components/ReviewForm.vue'

const NOT_FOUND_MESSAGE = 'Produkt nicht gefunden.'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const reviewEditingGateway = injectGateway(reviewEditingGatewayKey)

const {
  data: product,
  loading,
  errorMessage: loadError,
  notFound,
} = useAsyncData(
  (productId: string) => reviewEditingGateway.fetchProduct(productId),
  () => String(route.params.id),
)

const pendingFiles = ref<File[]>([])

const {
  submitting,
  errorMessage: submitError,
  submit,
} = useSubmit(async (values: ReviewFormValues): Promise<void> => {
  const user = authStore.user
  if (!product.value || !user) return
  const { tags, ...fields } = values
  const review = await reviewEditingGateway.createReview(product.value.id, user.id, fields, tags)
  await Promise.all(
    pendingFiles.value.map((file, i) =>
      reviewEditingGateway.uploadReviewImage(review.id, user.id, file, i),
    ),
  )
  await router.push({
    name: 'product-detail',
    params: { id: product.value.id },
    query: { [CELEBRATION_QUERY_KEY]: '1' },
  })
})
</script>

<template>
  <div class="max-w-lg mx-auto">
    <LoadingText v-if="loading" />
    <AlertMessage v-else-if="notFound" :message="NOT_FOUND_MESSAGE" />
    <AlertMessage v-else-if="loadError" :message="loadError" />
    <template v-else-if="product">
      <ReviewFormHeading :product-name="product.name" :brand="product.brand" />

      <AlertMessage :message="submitError" class="mb-4" />

      <ReviewForm
        :submitting="submitting"
        @submit="submit"
        @files-changed="pendingFiles = $event"
      />
    </template>
  </div>
</template>
