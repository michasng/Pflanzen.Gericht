<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { injectGateway } from '@/composables/injectGateway'
import { productEditingGatewayKey } from '@/services/productEditingGatewayKey'
import { useSubmit } from '@/composables/useSubmit'
import ProductForm from '@/components/ProductForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import type { ProductFormValues } from '@/types/productForm'

const router = useRouter()
const authStore = useAuthStore()
const productEditingGateway = injectGateway(productEditingGatewayKey)

const pendingFiles = ref<File[]>([])

const {
  submitting,
  errorMessage: error,
  submit,
} = useSubmit(async (values: ProductFormValues): Promise<void> => {
  const user = authStore.user
  if (!user) return
  const { ingredients, nutrients, sourceUrls, ...fields } = values
  const product = await productEditingGateway.createProduct(fields, user.id)
  await Promise.all([
    productEditingGateway.replaceProductIngredients(product.id, ingredients),
    productEditingGateway.replaceProductNutrients(product.id, nutrients),
    productEditingGateway.replaceProductSources(product.id, sourceUrls),
    ...pendingFiles.value.map((file, i) =>
      productEditingGateway.uploadProductImage(product.id, user.id, file, i),
    ),
  ])
  await router.push({ name: 'product-detail', params: { id: product.id } })
})
</script>

<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-xl font-bold text-gray-900 mb-6">Produkt hinzufügen</h1>

    <AlertMessage :message="error" class="mb-4" />

    <ProductForm :submitting="submitting" @submit="submit" @files-changed="pendingFiles = $event" />
  </div>
</template>
