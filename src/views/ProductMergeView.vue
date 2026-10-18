<script setup lang="ts">
import { ref, computed, provide, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductForm from '@/components/ProductForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import MergeImagePicker from '@/components/merge/MergeImagePicker.vue'
import MergeOwnerPicker from '@/components/merge/MergeOwnerPicker.vue'
import MergeActivitySummary from '@/components/merge/MergeActivitySummary.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSubmit } from '@/composables/useSubmit'
import { injectGateway } from '@/composables/injectGateway'
import { productEditingGatewayKey } from '@/services/productEditingGatewayKey'
import { loadMergeSource } from '@/services/loadMergeSource'
import { orderProductPairByCreation } from '@/lib/orderProductPairByCreation'
import { mergeProductFormValues } from '@/lib/mergeProductFormValues'
import { DEFAULT_COMPARISON_SIDE_LABELS, comparisonSideLabelsKey } from '@/lib/comparisonSideLabels'
import { COMPARISON_SIDES, ComparisonSide } from '@/types/ComparisonSide'
import type { MergeSource } from '@/types/MergeSource'
import type {
  ProductFormComparison,
  ProductFormInitialValues,
  ProductFormValues,
} from '@/types/productForm'

interface MergePair {
  a: unknown
  b: unknown
}

const route = useRoute()
const router = useRouter()
const productEditingGateway = injectGateway(productEditingGatewayKey)

const ownerSide = ref<ComparisonSide | null>(null)
const acceptedImageIds = ref<string[]>([])

const loadMergeSources = async ({
  a,
  b,
}: MergePair): Promise<Record<ComparisonSide, MergeSource>> => {
  if (typeof a !== 'string' || typeof b !== 'string' || a === b) {
    throw new Error('Bitte wähle genau zwei verschiedene Produkte aus.')
  }
  const [first, second] = await Promise.all([
    loadMergeSource(productEditingGateway, a),
    loadMergeSource(productEditingGateway, b),
  ])
  const [earlierProduct] = orderProductPairByCreation(first.product, second.product)
  const [sourceA, sourceB] = earlierProduct === first.product ? [first, second] : [second, first]
  return { [ComparisonSide.A]: sourceA, [ComparisonSide.B]: sourceB }
}

const {
  data: sources,
  loading,
  errorMessage: loadError,
} = useAsyncData(loadMergeSources, (): MergePair => ({ a: route.query.a, b: route.query.b }))

const allImages = computed(() =>
  COMPARISON_SIDES.flatMap((side) => sources.value?.[side].images ?? []),
)

watch(sources, () => {
  acceptedImageIds.value = allImages.value.map((image) => image.id)
})

const comparison = computed<ProductFormComparison | null>(() =>
  sources.value
    ? { a: sources.value[ComparisonSide.A].values, b: sources.value[ComparisonSide.B].values }
    : null,
)

const initialValues = computed<ProductFormInitialValues>(() =>
  comparison.value ? mergeProductFormValues(comparison.value.a, comparison.value.b) : {},
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

const {
  submitting,
  errorMessage: submitError,
  submit,
} = useSubmit(async (values: ProductFormValues): Promise<void> => {
  if (!sources.value) return
  if (!ownerSide.value) {
    throw new Error('Bitte wähle aus, wer das zusammengeführte Produkt besitzt.')
  }
  const merged = await productEditingGateway.mergeProducts({
    productIds: [
      sources.value[ComparisonSide.A].product.id,
      sources.value[ComparisonSide.B].product.id,
    ],
    values,
    acceptedImages: allImages.value.filter((image) => acceptedImageIds.value.includes(image.id)),
    ownerId: sources.value[ownerSide.value].product.createdBy,
  })
  await router.push({ name: 'product-detail', params: { id: merged.id } })
})
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
        @submit="submit"
      >
        <template #extras>
          <MergeImagePicker v-model="acceptedImageIds" :images="allImages" />
          <MergeOwnerPicker v-model="ownerSide" :side-labels="sideLabels" />
          <MergeActivitySummary :side-labels="sideLabels" :activity-counts="sources" />
        </template>
      </ProductForm>
    </template>
  </div>
</template>
