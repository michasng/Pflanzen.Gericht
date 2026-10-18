<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAsyncData } from '@/composables/useAsyncData'
import { useImageUpload } from '@/composables/useImageUpload'
import { injectGateway } from '@/composables/injectGateway'
import { productEditingGatewayKey } from '@/services/productEditingGatewayKey'
import { useSubmit } from '@/composables/useSubmit'
import ProductForm from '@/components/ProductForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import { formatDate } from '@/lib/date'
import { hasProductFieldsChanged } from '@/lib/hasProductFieldsChanged'
import { haveSameElements } from '@/lib/haveSameElements'
import { toProductFormValues } from '@/lib/toProductFormValues'
import type { ProductReviewImages } from '@/services/reviews'
import type { Product, ProductImage, ReviewImage } from '@/types'
import type { ProductFormValues } from '@/types/productForm'

interface ProductEditData {
  product: Product
  initialValues: ProductFormValues
  reviewImageGroups: ProductReviewImages[]
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const productEditingGateway = injectGateway(productEditingGatewayKey)

const { pendingFiles, selectCopies, existingImages, handleDeleteImage, commitImageChanges } =
  useImageUpload<ProductImage, ReviewImage>(
    (file, sortOrder) => {
      if (!editData.value || !authStore.user) return Promise.resolve()
      return productEditingGateway.uploadProductImage(
        editData.value.product.id,
        authStore.user.id,
        file,
        sortOrder,
      )
    },
    (image) => productEditingGateway.deleteProductImage(image.id, image.storagePath),
    (reviewImage, sortOrder) => {
      if (!editData.value || !authStore.user) return Promise.resolve()
      return productEditingGateway.copyReviewImageToProduct(
        reviewImage,
        editData.value.product.id,
        authStore.user.id,
        sortOrder,
      )
    },
  )

const loadProductEditData = async (productId: string): Promise<ProductEditData | null> => {
  const [product, images, ingredients, nutrients, sources, reviewImageGroups] = await Promise.all([
    productEditingGateway.fetchProduct(productId),
    productEditingGateway.fetchProductImages(productId),
    productEditingGateway.fetchProductIngredients(productId),
    productEditingGateway.fetchProductNutrients(productId),
    productEditingGateway.fetchProductSources(productId),
    authStore.isAdmin
      ? productEditingGateway.fetchProductReviewImages(productId)
      : Promise.resolve([]),
  ])
  if (!product) throw new Error('Produkt nicht gefunden.')
  if (product.createdBy !== authStore.user?.id && !authStore.isAdmin) {
    await router.replace({ name: 'product-detail', params: { id: productId } })
    return null
  }
  existingImages.value = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
  return {
    product,
    initialValues: toProductFormValues(product, ingredients, nutrients, sources),
    reviewImageGroups,
  }
}

const {
  data: editData,
  loading,
  errorMessage: loadError,
} = useAsyncData(loadProductEditData, () => String(route.params.id))

const imageCopySources = computed(() =>
  authStore.isAdmin
    ? (editData.value?.reviewImageGroups ?? []).map((group) => ({
        label: `${group.reviewerName} · ${formatDate(group.createdAt)}`,
        images: group.images,
      }))
    : [],
)

const handleCopySelectionChanged = (imageIds: string[]): void => {
  selectCopies(
    (editData.value?.reviewImageGroups ?? [])
      .flatMap((group) => group.images)
      .filter((image) => imageIds.includes(image.id)),
  )
}

const toIngredientKey = (ingredient: ProductFormValues['ingredients'][number]): string =>
  `${ingredient.name}|${ingredient.comparator}|${ingredient.fractionBasisPoints ?? ''}`

const toNutrientKey = (nutrient: ProductFormValues['nutrients'][number]): string =>
  `${nutrient.name}|${nutrient.amountMicrograms}`

const toSourceKey = (url: string): string => url

const {
  submitting,
  errorMessage: submitError,
  submit,
} = useSubmit(async (values: ProductFormValues): Promise<void> => {
  if (!editData.value || !authStore.user) return
  const { product, initialValues } = editData.value
  const { ingredients, nutrients, sourceUrls, ...fields } = values
  if (hasProductFieldsChanged(product, fields)) {
    await productEditingGateway.updateProduct(product.id, fields)
  }
  if (!haveSameElements(initialValues.ingredients, ingredients, toIngredientKey)) {
    await productEditingGateway.replaceProductIngredients(product.id, ingredients)
  }
  if (!haveSameElements(initialValues.nutrients, nutrients, toNutrientKey)) {
    await productEditingGateway.replaceProductNutrients(product.id, nutrients)
  }
  if (!haveSameElements(initialValues.sourceUrls, sourceUrls, toSourceKey)) {
    await productEditingGateway.replaceProductSources(product.id, sourceUrls)
  }
  await commitImageChanges()
  await router.push({ name: 'product-detail', params: { id: product.id } })
})
</script>

<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-xl font-bold text-gray-900 mb-6">Produkt bearbeiten</h1>

    <LoadingText v-if="loading" />
    <AlertMessage v-else-if="loadError" :message="loadError" />
    <template v-else-if="editData">
      <AlertMessage :message="submitError" class="mb-4" />
      <ProductForm
        :initial="editData.initialValues"
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
