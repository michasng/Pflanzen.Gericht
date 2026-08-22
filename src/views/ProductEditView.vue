<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ProductForm from '@/components/ProductForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import {
  fetchProduct,
  fetchProductImages,
  updateProduct,
  uploadProductImage,
  deleteProductImage,
} from '@/services/products'
import { toErrorMessage } from '@/lib/error'
import type { Product, ProductImage } from '@/types'
import type { ProductFormValues } from '@/components/ProductForm.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const product = ref<Product | null>(null)
const existingImages = ref<ProductImage[]>([])
const loading = ref(true)
const loadError = ref<string | null>(null)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const pendingFiles = ref<File[]>([])
const imagesToDelete = ref<ProductImage[]>([])

onMounted(async () => {
  const id = route.params.id as string
  try {
    const [p, imgs] = await Promise.all([fetchProduct(id), fetchProductImages(id)])
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
  } catch (err) {
    loadError.value = toErrorMessage(err)
  } finally {
    loading.value = false
  }
})

async function handleSubmit(values: ProductFormValues): Promise<void> {
  if (!product.value || !authStore.user) return
  submitting.value = true
  submitError.value = null
  try {
    await updateProduct(product.value.id, values)
    for (const img of imagesToDelete.value) {
      await deleteProductImage(img.id, img.storage_path)
    }
    const nextSortOrder = existingImages.value.length
    await Promise.all(
      pendingFiles.value.map((file, i) =>
        uploadProductImage(product.value!.id, authStore.user!.id, file, nextSortOrder + i),
      ),
    )
    await router.push({ name: 'product-detail', params: { id: product.value.id } })
  } catch (err) {
    submitError.value = toErrorMessage(err)
    submitting.value = false
  }
}

function handleDeleteImage(img: ProductImage): void {
  imagesToDelete.value.push(img)
  existingImages.value = existingImages.value.filter((i) => i.id !== img.id)
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-xl font-bold text-gray-900 mb-6">Produkt bearbeiten</h1>

    <div v-if="loading" class="py-12 text-center text-gray-400 text-sm">Wird geladen …</div>
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
