<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductForm from '@/components/ProductForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import Image from '@/components/primitives/ImageComponent.vue'
import Card from '@/components/primitives/CardComponent.vue'
import { ImageSize } from '@/config/imageSizes'
import {
  fetchProduct,
  fetchProductImages,
  fetchProductIngredients,
  fetchProductNutrients,
} from '@/services/products'
import { fetchPublicProfile } from '@/services/profile'
import { getImageUrl } from '@/services/catalog'
import { mergeProducts } from '@/services/mergeProducts'
import { fetchProductActivityCounts } from '@/services/fetchProductActivityCounts'
import { supabaseProductMergeGateway } from '@/services/supabaseProductMergeGateway'
import { toErrorMessage } from '@/lib/error'
import { orderProductPairByCreation } from '@/lib/orderProductPairByCreation'
import { toProductFormValues } from '@/lib/toProductFormValues'
import { formatCountWithNoun } from '@/lib/formatCountWithNoun'
import { mergeProductFormValues } from '@/lib/mergeProductFormValues'
import { DEFAULT_COMPARISON_SIDE_LABELS, comparisonSideLabelsKey } from '@/lib/comparisonSideLabels'
import { ComparisonSide } from '@/types/ComparisonSide'
import type { Product, ProductImage } from '@/types'
import type {
  ProductFormComparison,
  ProductFormInitialValues,
  ProductFormValues,
} from '@/types/productForm'

interface MergeSource {
  product: Product
  images: ProductImage[]
  values: ProductFormValues
  ownerName: string
  reviewsCount: number
  priceReportsCount: number
  similarityVotesCount: number
}

const SIDES = [ComparisonSide.A, ComparisonSide.B]

const route = useRoute()
const router = useRouter()

const sources = ref<Record<ComparisonSide, MergeSource> | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const ownerSide = ref<ComparisonSide | null>(null)
const acceptedImageIds = ref<string[]>([])

const loadSource = async (id: string): Promise<MergeSource> => {
  const [product, images, ingredients, nutrients, counts] = await Promise.all([
    fetchProduct(id),
    fetchProductImages(id),
    fetchProductIngredients(id),
    fetchProductNutrients(id),
    fetchProductActivityCounts(id),
  ])
  if (!product) throw new Error('Produkt nicht gefunden.')
  const profile = await fetchPublicProfile(product.created_by)
  return {
    product,
    images,
    values: toProductFormValues(product, ingredients, nutrients),
    ownerName: profile?.display_name || profile?.username || 'Unbekannt',
    ...counts,
  }
}

onMounted(async () => {
  const { a, b } = route.query
  try {
    if (typeof a !== 'string' || typeof b !== 'string' || a === b) {
      throw new Error('Bitte wähle genau zwei verschiedene Produkte aus.')
    }
    const [first, second] = await Promise.all([loadSource(a), loadSource(b)])
    const [earlierProduct] = orderProductPairByCreation(first.product, second.product)
    const [sourceA, sourceB] = earlierProduct === first.product ? [first, second] : [second, first]
    sources.value = { [ComparisonSide.A]: sourceA, [ComparisonSide.B]: sourceB }
    acceptedImageIds.value = [...sourceA.images, ...sourceB.images].map((image) => image.id)
  } catch (err) {
    loadError.value = toErrorMessage(err)
  } finally {
    loading.value = false
  }
})

const comparison = computed<ProductFormComparison | null>(() =>
  sources.value
    ? { a: sources.value[ComparisonSide.A].values, b: sources.value[ComparisonSide.B].values }
    : null,
)

const sideLabels = computed<Record<ComparisonSide, string>>(() =>
  sources.value
    ? {
        [ComparisonSide.A]: sources.value[ComparisonSide.A].ownerName,
        [ComparisonSide.B]: sources.value[ComparisonSide.B].ownerName,
      }
    : DEFAULT_COMPARISON_SIDE_LABELS,
)
provide(comparisonSideLabelsKey, sideLabels)

const initialValues = computed<ProductFormInitialValues>(() =>
  comparison.value ? mergeProductFormValues(comparison.value.a, comparison.value.b) : {},
)

const allImages = computed(() =>
  sources.value ? SIDES.flatMap((side) => sources.value?.[side].images ?? []) : [],
)

const handleSubmit = async (values: ProductFormValues): Promise<void> => {
  if (!sources.value) return
  if (!ownerSide.value) {
    submitError.value = 'Bitte wähle aus, wer das zusammengeführte Produkt besitzt.'
    return
  }
  submitting.value = true
  submitError.value = null
  try {
    const merged = await mergeProducts(supabaseProductMergeGateway, {
      productIds: [
        sources.value[ComparisonSide.A].product.id,
        sources.value[ComparisonSide.B].product.id,
      ],
      values,
      acceptedImages: allImages.value.filter((image) => acceptedImageIds.value.includes(image.id)),
      ownerId: sources.value[ownerSide.value].product.created_by,
    })
    await router.push({ name: 'product-detail', params: { id: merged.id } })
  } catch (err) {
    submitError.value = toErrorMessage(err)
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <h1 class="text-xl font-bold text-gray-900 mb-6">Produkte zusammenführen</h1>

    <LoadingText v-if="loading" />
    <AlertMessage v-else-if="loadError" :message="loadError" />
    <template v-else-if="sources && comparison">
      <AlertMessage :message="submitError" class="mb-4" />
      <ProductForm
        :initial="initialValues"
        :comparison="comparison"
        :submitting="submitting"
        submit-label="Zusammenführen"
        @submit="handleSubmit"
      >
        <template #extras>
          <div>
            <p class="text-sm font-medium text-gray-700 mb-2">Bilder</p>
            <p v-if="!allImages.length" class="text-sm text-gray-400">Keine Bilder vorhanden.</p>
            <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <label
                v-for="(image, index) in allImages"
                :key="image.id"
                class="relative rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
              >
                <Image
                  :src="getImageUrl('product-images', image.storage_path, ImageSize.Thumbnail)"
                  alt=""
                />
                <span
                  class="absolute bottom-0 inset-x-0 flex items-center gap-1 bg-black/60 px-2 py-1 text-xs text-white"
                >
                  <input
                    v-model="acceptedImageIds"
                    type="checkbox"
                    class="h-4 w-4 rounded"
                    :value="image.id"
                    :aria-label="`Bild ${index + 1} akzeptieren`"
                  />
                  Akzeptieren
                </span>
              </label>
            </div>
          </div>

          <fieldset>
            <legend class="text-sm font-medium text-gray-700 mb-2">
              Besitzer <span class="text-red-500" aria-hidden="true">*</span>
            </legend>
            <div class="flex gap-4">
              <label v-for="side in SIDES" :key="side" class="flex items-center gap-2 text-sm">
                <input v-model="ownerSide" type="radio" name="owner" :value="side" />
                {{ sideLabels[side] }}
              </label>
            </div>
          </fieldset>

          <Card>
            <p class="text-sm font-medium text-gray-700 mb-2">
              Bewertungen, Preise und Ähnliche Produkte werden vereint
            </p>
            <ul class="text-sm text-gray-600 space-y-0.5">
              <li v-for="side in SIDES" :key="side">
                {{ sideLabels[side] }}:
                {{ formatCountWithNoun(sources[side].reviewsCount, 'Bewertung', 'Bewertungen') }},
                {{ formatCountWithNoun(sources[side].priceReportsCount, 'Preis', 'Preise') }},
                {{
                  formatCountWithNoun(
                    sources[side].similarityVotesCount,
                    'Ähnliches Produkt',
                    'Ähnliche Produkte',
                  )
                }}
              </li>
            </ul>
          </Card>
        </template>
      </ProductForm>
    </template>
  </div>
</template>
