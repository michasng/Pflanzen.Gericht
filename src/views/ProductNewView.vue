<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ProductForm from '@/components/ProductForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import {
  createProduct,
  uploadProductImage,
  replaceProductIngredients,
  replaceProductNutrients,
} from '@/services/products'
import { toErrorMessage } from '@/lib/error'
import type { ProductFormValues } from '@/components/ProductForm.vue'

const router = useRouter()
const authStore = useAuthStore()

const submitting = ref(false)
const error = ref<string | null>(null)
const pendingFiles = ref<File[]>([])

const handleSubmit = async (values: ProductFormValues): Promise<void> => {
  const user = authStore.user
  if (!user) return
  submitting.value = true
  error.value = null
  try {
    const { ingredients, nutrients, energyJoules, ...fields } = values
    const product = await createProduct({ ...fields, energy_joules: energyJoules }, user.id)
    await Promise.all([
      replaceProductIngredients(
        product.id,
        ingredients.map((ingredient) => ({
          name: ingredient.name,
          fraction_basis_points: ingredient.fractionBasisPoints,
          comparator: ingredient.comparator,
        })),
      ),
      replaceProductNutrients(
        product.id,
        nutrients.map((nutrient) => ({
          name: nutrient.name,
          amount_micrograms: nutrient.amountMicrograms,
        })),
      ),
      ...pendingFiles.value.map((file, i) => uploadProductImage(product.id, user.id, file, i)),
    ])
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

    <AlertMessage :message="error" class="mb-4" />

    <ProductForm
      :submitting="submitting"
      @submit="handleSubmit"
      @files-changed="pendingFiles = $event"
    />
  </div>
</template>
