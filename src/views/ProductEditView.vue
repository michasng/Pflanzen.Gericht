<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ProductForm from '@/components/ProductForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import {
  fetchProduct,
  fetchProductImages,
  fetchProductIngredients,
  updateProduct,
  uploadProductImage,
  deleteProductImage,
  replaceProductIngredients,
} from '@/services/products'
import { toErrorMessage } from '@/lib/error'
import { useImageUpload } from '@/composables/useImageUpload'
import type { Product, ProductImage } from '@/types'
import type { ProductFormValues } from '@/components/ProductForm.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const product = ref<Product | null>(null)
const initialIngredients = ref<ProductFormValues['ingredients']>([])
const loading = ref(true)
const loadError = ref<string | null>(null)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const { pendingFiles, existingImages, handleDeleteImage, commitImageChanges } =
  useImageUpload<ProductImage>(
    (file, sortOrder) => {
      if (!product.value || !authStore.user) return Promise.resolve()
      return uploadProductImage(product.value.id, authStore.user.id, file, sortOrder)
    },
    (img) => deleteProductImage(img.id, img.storage_path),
  )

onMounted(async () => {
  const id = route.params.id as string
  try {
    const [p, imgs, ingredients] = await Promise.all([
      fetchProduct(id),
      fetchProductImages(id),
      fetchProductIngredients(id),
    ])
    if (!p) {
      loadError.value = 'Produkt nicht gefunden.'
      return
    }
    if (p.created_by !== authStore.user?.id && !authStore.isAdmin) {
      await router.replace({ name: 'product-detail', params: { id } })
      return
    }
    product.value = p
    existingImages.value = imgs.sort((a, b) => a.sort_order - b.sort_order)
    initialIngredients.value = ingredients.map((ingredient) => ({
      name: ingredient.name,
      percentage: ingredient.percentage,
      comparator: ingredient.comparator as ProductFormValues['ingredients'][number]['comparator'],
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
    const { ingredients, ...fields } = values
    await updateProduct(product.value.id, fields)
    await Promise.all([
      replaceProductIngredients(product.value.id, ingredients),
      commitImageChanges(),
    ])
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
          ingredients: initialIngredients,
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
