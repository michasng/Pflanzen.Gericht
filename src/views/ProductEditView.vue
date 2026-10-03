<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ProductForm from '@/components/ProductForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import { ALLERGENS } from '@/config/allergens'
import {
  fetchProduct,
  fetchProductImages,
  fetchProductIngredients,
  fetchProductNutrients,
  updateProduct,
  uploadProductImage,
  deleteProductImage,
  copyReviewImageToProduct,
  replaceProductIngredients,
  replaceProductNutrients,
} from '@/services/products'
import { fetchProductReviewImages, type ProductReviewImages } from '@/services/reviews'
import { formatDate } from '@/lib/date'
import { toErrorMessage } from '@/lib/error'
import { toQuantityUnit } from '@/lib/toQuantityUnit'
import { useImageUpload } from '@/composables/useImageUpload'
import type { Product, ProductImage, ReviewImage } from '@/types'
import type { ProductFormValues } from '@/types/productForm'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const product = ref<Product | null>(null)
const initialIngredients = ref<ProductFormValues['ingredients']>([])
const initialNutrients = ref<ProductFormValues['nutrients']>([])
const loading = ref(true)
const loadError = ref<string | null>(null)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const knownAllergens = new Set<string>(ALLERGENS)
const reviewImageGroups = ref<ProductReviewImages[]>([])
const imageCopySources = computed(() =>
  authStore.isAdmin
    ? reviewImageGroups.value.map((group) => ({
        label: `${group.reviewerName} · ${formatDate(group.createdAt)}`,
        images: group.images,
      }))
    : [],
)
const { pendingFiles, selectCopies, existingImages, handleDeleteImage, commitImageChanges } =
  useImageUpload<ProductImage, ReviewImage>(
    (file, sortOrder) => {
      if (!product.value || !authStore.user) return Promise.resolve()
      return uploadProductImage(product.value.id, authStore.user.id, file, sortOrder)
    },
    (img) => deleteProductImage(img.id, img.storagePath),
    (reviewImage, sortOrder) => {
      if (!product.value || !authStore.user) return Promise.resolve()
      return copyReviewImageToProduct(reviewImage, product.value.id, authStore.user.id, sortOrder)
    },
  )

const handleCopySelectionChanged = (imageIds: string[]): void => {
  selectCopies(
    reviewImageGroups.value
      .flatMap((group) => group.images)
      .filter((image) => imageIds.includes(image.id)),
  )
}

const toIngredientSignature = (ingredient: ProductFormValues['ingredients'][number]): string =>
  `${ingredient.name}|${ingredient.comparator}|${ingredient.fractionBasisPoints === null ? '' : ingredient.fractionBasisPoints}`

const haveSameIngredients = (
  currentIngredients: ProductFormValues['ingredients'],
  nextIngredients: ProductFormValues['ingredients'],
): boolean => {
  if (currentIngredients.length !== nextIngredients.length) return false
  const currentSignatures = currentIngredients.map(toIngredientSignature).sort()
  const nextSignatures = nextIngredients.map(toIngredientSignature).sort()
  return currentSignatures.every((signature, index) => signature === nextSignatures[index])
}

const toNutrientSignature = (nutrient: ProductFormValues['nutrients'][number]): string =>
  `${nutrient.name}|${nutrient.amountMicrograms}`

const isKnownAllergen = (allergen: string): allergen is ProductFormValues['allergens'][number] =>
  knownAllergens.has(allergen)

const haveSameNutrients = (
  currentNutrients: ProductFormValues['nutrients'],
  nextNutrients: ProductFormValues['nutrients'],
): boolean => {
  if (currentNutrients.length !== nextNutrients.length) return false
  const currentSignatures = currentNutrients.map(toNutrientSignature).sort()
  const nextSignatures = nextNutrients.map(toNutrientSignature).sort()
  return currentSignatures.every((signature, index) => signature === nextSignatures[index])
}

onMounted(async () => {
  const id = route.params.id as string
  try {
    const [p, imgs, ingredients, nutrients, reviewImages] = await Promise.all([
      fetchProduct(id),
      fetchProductImages(id),
      fetchProductIngredients(id),
      fetchProductNutrients(id),
      authStore.isAdmin ? fetchProductReviewImages(id) : Promise.resolve([]),
    ])
    if (!p) {
      loadError.value = 'Produkt nicht gefunden.'
      return
    }
    if (p.createdBy !== authStore.user?.id && !authStore.isAdmin) {
      await router.replace({ name: 'product-detail', params: { id } })
      return
    }
    product.value = p
    reviewImageGroups.value = reviewImages
    existingImages.value = imgs.sort((a, b) => a.sortOrder - b.sortOrder)
    initialIngredients.value = ingredients.map((ingredient) => ({
      name: ingredient.name,
      fractionBasisPoints: ingredient.fractionBasisPoints,
      comparator: ingredient.comparator as ProductFormValues['ingredients'][number]['comparator'],
    }))
    initialNutrients.value = nutrients.map((nutrient) => ({
      name: nutrient.name,
      amountMicrograms: nutrient.amountMicrograms,
    }))
  } catch (err) {
    loadError.value = toErrorMessage(err)
  } finally {
    loading.value = false
  }
})

const handleSubmit = async (values: ProductFormValues): Promise<void> => {
  if (!product.value || !authStore.user) return
  submitting.value = true
  submitError.value = null
  try {
    const { ingredients, nutrients, ...fields } = values
    const submittedAllergens = new Set<string>(fields.allergens)
    const shouldUpdateProductFields =
      product.value.name !== fields.name ||
      product.value.category !== fields.category ||
      product.value.base !== fields.base ||
      product.value.brand !== fields.brand ||
      product.value.description !== fields.description ||
      product.value.energyJoules !== fields.energyJoules ||
      product.value.isOrganic !== fields.isOrganic ||
      product.value.barcode !== fields.barcode ||
      product.value.quantityUnit !== fields.quantityUnit ||
      product.value.quantityValue !== fields.quantityValue ||
      product.value.allergens.length !== fields.allergens.length ||
      product.value.allergens.some((allergen) => !submittedAllergens.has(allergen))
    if (shouldUpdateProductFields) {
      await updateProduct(product.value.id, fields)
    }
    const shouldReplaceIngredients = !haveSameIngredients(initialIngredients.value, ingredients)
    if (shouldReplaceIngredients) {
      await replaceProductIngredients(product.value.id, ingredients)
    }
    const shouldReplaceNutrients = !haveSameNutrients(initialNutrients.value, nutrients)
    if (shouldReplaceNutrients) {
      await replaceProductNutrients(product.value.id, nutrients)
    }
    await commitImageChanges()
    await router.push({ name: 'product-detail', params: { id: product.value.id } })
  } catch (err) {
    submitError.value = toErrorMessage(err)
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-xl font-bold text-gray-900 mb-6">Produkt bearbeiten</h1>

    <LoadingText v-if="loading" />
    <AlertMessage v-else-if="loadError" :message="loadError" />
    <template v-else-if="product">
      <AlertMessage :message="submitError" class="mb-4" />
      <ProductForm
        :initial="{
          name: product.name,
          category: product.category,
          base: product.base,
          brand: product.brand,
          description: product.description,
          energyJoules: product.energyJoules,
          allergens: product.allergens.filter(isKnownAllergen),
          isOrganic: product.isOrganic,
          barcode: product.barcode,
          quantityUnit: toQuantityUnit(product.quantityUnit),
          quantityValue: product.quantityValue,
          ingredients: initialIngredients,
          nutrients: initialNutrients,
        }"
        :existing-images="existingImages"
        :submitting="submitting"
        @submit="handleSubmit"
        @files-changed="pendingFiles = $event"
        :image-copy-sources="imageCopySources"
        @delete-image="handleDeleteImage"
        @copy-selection-changed="handleCopySelectionChanged"
      />
    </template>
  </div>
</template>
