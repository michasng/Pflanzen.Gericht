<script lang="ts">
import type { IngredientComparator } from '@/config/ingredients'

export interface ProductFormIngredient {
  name: string
  fractionBasisPoints: number | null
  comparator: IngredientComparator
}

export interface ProductFormNutrient {
  name: string
  amountMicrograms: number
}

export interface ProductFormValues {
  name: string
  category: string
  base: string | null
  brand: string | null
  description: string | null
  energyKilojoules: number | null
  ingredients: ProductFormIngredient[]
  nutrients: ProductFormNutrient[]
}
</script>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { CATEGORIES, CATEGORY_LABELS, BASES, BASE_LABELS } from '@/config/taxonomy'
import type { Category, Base } from '@/config/taxonomy'
import { INGREDIENT_COMPARATORS, DEFAULT_INGREDIENT_COMPARATOR } from '@/config/ingredients'
import { NUTRIENT_UNITS, NUTRIENT_UNIT_LABELS, DEFAULT_NUTRIENT_UNIT } from '@/config/nutrients'
import type { NutrientUnit } from '@/config/nutrients'
import { ENERGY_UNITS, ENERGY_UNIT_LABELS, DEFAULT_ENERGY_UNIT } from '@/config/energy'
import type { EnergyUnit } from '@/config/energy'
import { exceedsWholeFraction } from '@/config/exceedsWholeFraction'
import { isLikelyNonVeganIngredient } from '@/config/isLikelyNonVeganIngredient'
import { sumGuaranteedFractionBasisPoints } from '@/config/sumGuaranteedFractionBasisPoints'
import { parsePercentInputToBasisPoints } from '@/lib/parsePercentInputToBasisPoints'
import { formatFractionBasisPointsAsPercent } from '@/lib/formatFractionBasisPointsAsPercent'
import { parseNutrientAmountInputToMicrograms } from '@/lib/parseNutrientAmountInputToMicrograms'
import { chooseNutrientDisplayUnit, formatNutrientAmountValue } from '@/lib/formatNutrientAmount'
import { parseEnergyInputToKilojoules } from '@/lib/parseEnergyInputToKilojoules'
import {
  searchSimilarProducts,
  fetchIngredientNameSuggestions,
  fetchNutrientNameSuggestions,
} from '@/services/products'
import { getImageUrl } from '@/services/catalog'
import type { Product, ProductImage } from '@/types'

const props = withDefaults(
  defineProps<{
    initial?: Partial<ProductFormValues>
    existingImages?: ProductImage[]
    submitting?: boolean
  }>(),
  { existingImages: () => [] },
)

const emit = defineEmits<{
  submit: [values: ProductFormValues]
  filesChanged: [files: File[]]
  deleteImage: [image: ProductImage]
}>()

const name = ref(props.initial?.name ?? '')
const category = ref(props.initial?.category ?? '')
const base = ref(props.initial?.base ?? '')
const brand = ref(props.initial?.brand ?? '')
const description = ref(props.initial?.description ?? '')

const energyInput = ref(
  props.initial?.energyKilojoules != null ? String(props.initial.energyKilojoules) : '',
)
const energyUnit = ref<EnergyUnit>(DEFAULT_ENERGY_UNIT)

const parsedEnergyKilojoules = computed(() =>
  parseEnergyInputToKilojoules(energyInput.value, energyUnit.value),
)

const hasInvalidEnergy = computed(
  () => energyInput.value.trim().length > 0 && parsedEnergyKilojoules.value === null,
)

interface IngredientRow {
  key: string
  name: string
  fractionInput: string
  comparator: IngredientComparator
}

const toRow = (ingredient: ProductFormIngredient): IngredientRow => ({
  key: crypto.randomUUID(),
  name: ingredient.name,
  fractionInput:
    ingredient.fractionBasisPoints !== null
      ? formatFractionBasisPointsAsPercent(ingredient.fractionBasisPoints).replace(' %', '')
      : '',
  comparator: ingredient.comparator,
})

const ingredientRows = ref<IngredientRow[]>((props.initial?.ingredients ?? []).map(toRow))
const ingredientSuggestions = ref<string[]>([])

onMounted(async () => {
  try {
    ingredientSuggestions.value = await fetchIngredientNameSuggestions()
  } catch {
    ingredientSuggestions.value = []
  }
})

const addIngredientRow = (): void => {
  ingredientRows.value = [
    ...ingredientRows.value,
    toRow({ name: '', fractionBasisPoints: null, comparator: DEFAULT_INGREDIENT_COMPARATOR }),
  ]
}

const removeIngredientRow = (key: string): void => {
  ingredientRows.value = ingredientRows.value.filter((row) => row.key !== key)
}

const parsedIngredients = computed(() =>
  ingredientRows.value
    .filter((row) => row.name.trim())
    .map((row) => {
      const fractionBasisPoints = parsePercentInputToBasisPoints(row.fractionInput)
      return {
        name: row.name.trim(),
        fractionBasisPoints,
        comparator: fractionBasisPoints !== null ? row.comparator : DEFAULT_INGREDIENT_COMPARATOR,
      }
    }),
)

const hasInvalidIngredientFraction = computed(() =>
  ingredientRows.value.some((row) => {
    const trimmedInput = row.fractionInput.trim()
    return trimmedInput.length > 0 && parsePercentInputToBasisPoints(trimmedInput) === null
  }),
)

const hasDuplicateIngredientNames = computed(() => {
  const names = ingredientRows.value.map((row) => row.name.trim()).filter(Boolean)
  return new Set(names).size !== names.length
})

const nonVeganIngredientNames = computed(() =>
  ingredientRows.value
    .filter((row) => isLikelyNonVeganIngredient(row.name))
    .map((row) => row.name.trim()),
)

const exceedsTotalFraction = computed(() =>
  exceedsWholeFraction(sumGuaranteedFractionBasisPoints(parsedIngredients.value)),
)

interface NutrientRow {
  key: string
  name: string
  amountInput: string
  unit: NutrientUnit
}

const toNutrientRow = (nutrient: ProductFormNutrient): NutrientRow => {
  const unit = chooseNutrientDisplayUnit(nutrient.amountMicrograms)
  return {
    key: crypto.randomUUID(),
    name: nutrient.name,
    amountInput: formatNutrientAmountValue(nutrient.amountMicrograms, unit),
    unit,
  }
}

const nutrientRows = ref<NutrientRow[]>((props.initial?.nutrients ?? []).map(toNutrientRow))
const nutrientSuggestions = ref<string[]>([])

onMounted(async () => {
  try {
    nutrientSuggestions.value = await fetchNutrientNameSuggestions()
  } catch {
    nutrientSuggestions.value = []
  }
})

const addNutrientRow = (): void => {
  nutrientRows.value = [
    ...nutrientRows.value,
    { key: crypto.randomUUID(), name: '', amountInput: '', unit: DEFAULT_NUTRIENT_UNIT },
  ]
}

const removeNutrientRow = (key: string): void => {
  nutrientRows.value = nutrientRows.value.filter((row) => row.key !== key)
}

const parsedNutrients = computed(() =>
  nutrientRows.value
    .filter((row) => row.name.trim() && row.amountInput.trim())
    .map((row) => ({
      name: row.name.trim(),
      amountMicrograms: parseNutrientAmountInputToMicrograms(row.amountInput, row.unit),
    }))
    .filter((nutrient): nutrient is ProductFormNutrient => nutrient.amountMicrograms !== null),
)

const hasInvalidNutrientAmount = computed(() =>
  nutrientRows.value.some((row) => {
    if (!row.name.trim()) return false
    const trimmedInput = row.amountInput.trim()
    return (
      trimmedInput.length === 0 ||
      parseNutrientAmountInputToMicrograms(trimmedInput, row.unit) === null
    )
  }),
)

const hasDuplicateNutrientNames = computed(() => {
  const names = nutrientRows.value.map((row) => row.name.trim()).filter(Boolean)
  return new Set(names).size !== names.length
})

type SimilarProduct = Pick<Product, 'id' | 'name' | 'brand' | 'category'>
const similarProducts = ref<SimilarProduct[]>([])
let dedupeTimer: ReturnType<typeof setTimeout> | undefined

watch(name, (val) => {
  clearTimeout(dedupeTimer)
  if (val.trim().length < 3) {
    similarProducts.value = []
    return
  }
  dedupeTimer = setTimeout(async () => {
    similarProducts.value = await searchSimilarProducts(val)
  }, 500)
})

const handleSubmit = (): void => {
  if (hasInvalidIngredientFraction.value) return
  if (hasDuplicateIngredientNames.value) return
  if (hasInvalidEnergy.value) return
  if (hasInvalidNutrientAmount.value) return
  if (hasDuplicateNutrientNames.value) return
  emit('submit', {
    name: name.value.trim(),
    category: category.value,
    base: base.value || null,
    brand: brand.value.trim() || null,
    description: description.value.trim() || null,
    energyKilojoules: parsedEnergyKilojoules.value,
    ingredients: parsedIngredients.value,
    nutrients: parsedNutrients.value,
  })
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-name">
        Name <span class="text-red-500" aria-hidden="true">*</span>
      </label>
      <input
        id="pf-name"
        v-model="name"
        type="text"
        required
        minlength="2"
        maxlength="120"
        placeholder="z. B. Alpro Soja-Drink Original"
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <div
        v-if="similarProducts.length"
        class="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm"
      >
        <p class="font-medium text-amber-800 mb-1">Ähnliche Produkte bereits vorhanden:</p>
        <ul class="space-y-1">
          <li v-for="p in similarProducts" :key="p.id">
            <RouterLink
              :to="{ name: 'product-detail', params: { id: p.id } }"
              target="_blank"
              class="text-amber-700 hover:text-amber-900 underline"
            >
              {{ p.name }}<span v-if="p.brand"> ({{ p.brand }})</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-category">
        Kategorie <span class="text-red-500" aria-hidden="true">*</span>
      </label>
      <select
        id="pf-category"
        v-model="category"
        required
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      >
        <option value="" disabled>Bitte wählen …</option>
        <option v-for="cat in CATEGORIES" :key="cat" :value="cat">
          {{ CATEGORY_LABELS[cat as Category] }}
        </option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-base">
        Basis
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </label>
      <select
        id="pf-base"
        v-model="base"
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      >
        <option value="">Keine Angabe</option>
        <option v-for="b in BASES" :key="b" :value="b">
          {{ BASE_LABELS[b as Base] }}
        </option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-brand">
        Marke / Hersteller
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </label>
      <input
        id="pf-brand"
        v-model="brand"
        type="text"
        maxlength="80"
        placeholder="z. B. Alpro"
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-description">
        Beschreibung
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </label>
      <textarea
        id="pf-description"
        v-model="description"
        rows="3"
        maxlength="500"
        placeholder="Kurze Beschreibung des Produkts …"
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-energy">
        Energie
        <span class="text-xs text-gray-400 font-normal">(optional, pro 100 g/ml)</span>
      </label>
      <div
        v-if="hasInvalidEnergy"
        role="alert"
        class="mb-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700"
      >
        Bitte gib für die Energie einen gültigen Wert ein.
      </div>
      <div class="flex gap-2">
        <input
          id="pf-energy"
          v-model="energyInput"
          type="text"
          inputmode="decimal"
          maxlength="8"
          placeholder="z. B. 1500"
          class="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          v-model="energyUnit"
          class="px-2 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option v-for="unit in ENERGY_UNITS" :key="unit" :value="unit">
            {{ ENERGY_UNIT_LABELS[unit] }}
          </option>
        </select>
      </div>
    </div>

    <div>
      <p class="text-sm font-medium text-gray-700 mb-1.5">
        Zutaten
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </p>
      <div
        v-if="hasInvalidIngredientFraction"
        role="alert"
        class="mb-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700"
      >
        Bitte gib für Zutatenanteile nur gültige Werte zwischen 0 und 100 ein.
      </div>
      <div
        v-if="hasDuplicateIngredientNames"
        role="alert"
        class="mb-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700"
      >
        Jede Zutat darf nur einmal eingetragen werden.
      </div>
      <div
        v-if="nonVeganIngredientNames.length"
        role="alert"
        class="mb-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800"
      >
        Achtung: {{ nonVeganIngredientNames.join(', ') }}
        {{ nonVeganIngredientNames.length > 1 ? 'sind' : 'ist' }}
        möglicherweise nicht vegan. Nicht-vegane Produkte sind in dieser App nicht erlaubt.
      </div>
      <div
        v-if="exceedsTotalFraction"
        role="alert"
        class="mb-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800"
      >
        Achtung: Die Zutatenanteile ergeben zusammen mehr als 100 %.
      </div>
      <div v-for="(row, index) in ingredientRows" :key="row.key" class="flex gap-2 mb-2">
        <input
          v-model="row.name"
          type="text"
          list="pf-ingredient-suggestions"
          maxlength="80"
          :placeholder="`Zutat ${index + 1}, z. B. Hafer`"
          class="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          v-model="row.comparator"
          :disabled="parsePercentInputToBasisPoints(row.fractionInput) === null"
          class="px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <option
            v-for="comparator in INGREDIENT_COMPARATORS"
            :key="comparator"
            :value="comparator"
          >
            {{ comparator }}
          </option>
        </select>
        <div class="flex items-center gap-1">
          <input
            v-model="row.fractionInput"
            type="text"
            inputmode="decimal"
            maxlength="6"
            placeholder="0,1"
            class="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span class="text-sm text-gray-500" aria-hidden="true">%</span>
        </div>
        <button
          type="button"
          class="px-2 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Zutat entfernen"
          @click="removeIngredientRow(row.key)"
        >
          ✕
        </button>
      </div>
      <datalist id="pf-ingredient-suggestions">
        <option v-for="suggestion in ingredientSuggestions" :key="suggestion" :value="suggestion" />
      </datalist>
      <button
        type="button"
        class="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
        @click="addIngredientRow"
      >
        + Zutat hinzufügen
      </button>
    </div>

    <div>
      <p class="text-sm font-medium text-gray-700 mb-1.5">
        Nährwerte
        <span class="text-xs text-gray-400 font-normal">(optional, pro 100 g/ml)</span>
      </p>
      <div
        v-if="hasInvalidNutrientAmount"
        role="alert"
        class="mb-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700"
      >
        Bitte gib für jeden Nährwert einen gültigen Wert ein.
      </div>
      <div
        v-if="hasDuplicateNutrientNames"
        role="alert"
        class="mb-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700"
      >
        Jeder Nährwert darf nur einmal eingetragen werden.
      </div>
      <div v-for="(row, index) in nutrientRows" :key="row.key" class="flex gap-2 mb-2">
        <input
          v-model="row.name"
          type="text"
          list="pf-nutrient-suggestions"
          maxlength="80"
          :placeholder="`Nährwert ${index + 1}, z. B. Ballaststoffe`"
          class="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <input
          v-model="row.amountInput"
          type="text"
          inputmode="decimal"
          maxlength="10"
          placeholder="0,8"
          class="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          v-model="row.unit"
          class="px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option v-for="unit in NUTRIENT_UNITS" :key="unit" :value="unit">
            {{ NUTRIENT_UNIT_LABELS[unit] }}
          </option>
        </select>
        <button
          type="button"
          class="px-2 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Nährwert entfernen"
          @click="removeNutrientRow(row.key)"
        >
          ✕
        </button>
      </div>
      <datalist id="pf-nutrient-suggestions">
        <option v-for="suggestion in nutrientSuggestions" :key="suggestion" :value="suggestion" />
      </datalist>
      <button
        type="button"
        class="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
        @click="addNutrientRow"
      >
        + Nährwert hinzufügen
      </button>
    </div>

    <div v-if="existingImages.length">
      <p class="text-sm font-medium text-gray-700 mb-2">Vorhandene Bilder</p>
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="img in existingImages"
          :key="img.id"
          class="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
        >
          <img
            :src="getImageUrl('product-images', img.storage_path)"
            alt=""
            class="w-full h-full object-cover"
          />
          <button
            type="button"
            class="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Bild entfernen"
            @click="emit('deleteImage', img)"
          >
            <svg
              class="w-3 h-3"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div>
      <p class="text-sm font-medium text-gray-700 mb-2">
        {{ existingImages.length ? 'Weitere Bilder hinzufügen' : 'Bilder' }}
        <span class="text-xs text-gray-400 font-normal">(optional)</span>
      </p>
      <ImageUpload @change="emit('filesChanged', $event)" />
    </div>

    <button
      type="submit"
      :disabled="submitting"
      class="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
    >
      {{ submitting ? 'Wird gespeichert …' : 'Speichern' }}
    </button>
  </form>
</template>
