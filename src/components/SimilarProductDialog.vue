<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppLogo from '@/components/AppLogo.vue'
import Image from '@/components/primitives/ImageComponent.vue'
import ReviewScoreDimensions from '@/components/ReviewScoreDimensions.vue'
import StarDisplay from '@/components/StarDisplay.vue'
import { allergenToLabel } from '@/config/allergens'
import { baseToLabel } from '@/config/bases'
import { getImageUrl } from '@/services/catalog'
import type { SimilarProduct } from '@/services/similarProducts'

const props = defineProps<{
  errorMessage: string | null
  isAdmin: boolean
  isBusy: boolean
  isLoggedIn: boolean
  loginRedirectPath: string
  product: SimilarProduct | null
}>()

defineEmits<{
  close: []
  remove: []
  vote: [agreed: boolean]
}>()

const coverUrl = computed(() =>
  props.product?.storage_path ? getImageUrl('product-images', props.product.storage_path) : null,
)
const agreementPercent = computed(() =>
  props.product ? Math.round(props.product.agreement_rate * 100) : 0,
)
const voteLabel = computed(() => {
  const voteCount = props.product?.total_count ?? 0
  return `${voteCount} Stimme${voteCount === 1 ? '' : 'n'}`
})
const criteriaAverages = computed(() => {
  if (!props.product) return []

  return [
    { label: 'Geschmack', value: props.product.avg_taste },
    { label: 'Konsistenz', value: props.product.avg_consistency },
    { label: 'Aussehen', value: props.product.avg_appearance },
    { label: 'Nährwerte', value: props.product.avg_nutrition },
    { label: 'Preis-Leistung', value: props.product.avg_value },
  ].filter((criterion): criterion is { label: string; value: number } => criterion.value !== null)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="product">
      <button
        type="button"
        class="fixed inset-0 z-40 bg-black/30"
        aria-label="Dialog schließen"
        @click="$emit('close')"
      ></button>

      <div
        role="dialog"
        aria-modal="true"
        :aria-label="`${product.name} als ähnliches Produkt`"
        class="fixed inset-x-4 top-1/2 z-50 max-h-[85dvh] -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-xl sm:mx-auto sm:max-w-lg"
      >
        <div
          class="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3"
        >
          <h2 class="text-base font-semibold text-gray-900">Ähnliches Produkt</h2>
          <button
            type="button"
            class="text-sm font-medium text-primary-600"
            @click="$emit('close')"
          >
            Schließen
          </button>
        </div>

        <div class="space-y-4 p-4">
          <RouterLink
            :to="{ name: 'product-detail', params: { id: product.id } }"
            class="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50"
          >
            <div class="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50">
              <Image v-if="coverUrl" :src="coverUrl" :alt="product.name" />
              <div v-else class="flex h-full w-full items-center justify-center">
                <AppLogo class="h-8 w-8 text-gray-200" />
              </div>
            </div>
            <div class="min-w-0">
              <h3 class="text-base font-semibold text-gray-900">{{ product.name }}</h3>
              <p v-if="product.brand" class="truncate text-sm text-gray-500">
                von {{ product.brand }}
              </p>
              <p class="mt-1 text-sm text-primary-600">Zum Produkt</p>
            </div>
          </RouterLink>

          <div class="rounded-xl border border-gray-100 p-3">
            <template v-if="product.avg_overall != null && product.ratings_count > 0">
              <div class="flex items-center gap-3">
                <span class="text-3xl font-bold text-gray-900 tabular-nums">
                  {{ product.avg_overall.toFixed(1) }}
                </span>
                <div>
                  <StarDisplay :value="product.avg_overall" />
                  <p class="mt-0.5 text-xs text-gray-400">
                    {{ product.ratings_count }}
                    Bewertung{{ product.ratings_count === 1 ? '' : 'en' }}
                  </p>
                </div>
              </div>
              <ReviewScoreDimensions
                v-if="criteriaAverages.length"
                class="mt-3"
                :scores="criteriaAverages"
              />
            </template>
            <p v-else class="text-sm text-gray-400">Noch keine Bewertungen vorhanden.</p>
          </div>

          <div
            v-if="product.base || product.is_organic || product.allergens.length"
            class="flex flex-wrap gap-1.5"
          >
            <span
              v-if="product.base"
              class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
            >
              {{ baseToLabel(product.base) }}
            </span>
            <span
              v-if="product.is_organic"
              class="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
            >
              Bio
            </span>
            <span
              v-for="allergen in product.allergens"
              :key="allergen"
              class="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700"
            >
              {{ allergenToLabel(allergen) }}
            </span>
          </div>

          <div class="rounded-xl border border-gray-100 p-3">
            <div class="mb-2 flex items-center justify-between gap-2 text-sm text-gray-600">
              <span>Zustimmung</span>
              <span class="font-medium text-gray-900">{{ agreementPercent }} %</span>
            </div>
            <div class="mb-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                class="h-full rounded-full bg-primary-500 transition-all"
                :style="{ width: `${agreementPercent}%` }"
              />
            </div>
            <p class="text-xs text-gray-400">{{ voteLabel }}</p>
          </div>

          <div v-if="isLoggedIn" class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
                :class="
                  product.my_vote === true
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-primary-300'
                "
                :disabled="isBusy"
                :aria-pressed="product.my_vote === true"
                aria-label="Daumen hoch"
                @click="$emit('vote', true)"
              >
                👍 Passt
              </button>
              <button
                type="button"
                class="rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
                :class="
                  product.my_vote === false
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:border-red-300'
                "
                :disabled="isBusy"
                :aria-pressed="product.my_vote === false"
                aria-label="Daumen runter"
                @click="$emit('vote', false)"
              >
                👎 Eher nicht
              </button>
            </div>

            <button
              v-if="isAdmin"
              type="button"
              aria-label="Ähnlichkeit entfernen"
              class="w-full rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              :disabled="isBusy"
              @click="$emit('remove')"
            >
              Ähnlichkeit entfernen
            </button>
          </div>

          <RouterLink
            v-else
            :to="{ name: 'login', query: { redirect: loginRedirectPath } }"
            class="block rounded-xl border border-primary-200 px-3 py-2 text-center text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
            @click="$emit('close')"
          >
            Anmelden zum Abstimmen
          </RouterLink>

          <p v-if="errorMessage" role="alert" class="text-xs text-red-600">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
