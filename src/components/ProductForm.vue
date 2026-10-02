<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ImageUpload from '@/components/ImageUpload.vue'
import ImageCopyPicker from '@/components/ImageCopyPicker.vue'
import Image from '@/components/primitives/ImageComponent.vue'
import ProductBarcodeScanner from '@/components/ProductBarcodeScanner.vue'
import SuggestionTextInput from '@/components/SuggestionTextInput.vue'
import type { IngredientComparator } from '@/config/ingredients'
import { CATEGORIES, categoryToLabel } from '@/config/categories'
import { BASES, baseToLabel } from '@/config/bases'
import { ALLERGENS, allergenToLabel } from '@/config/allergens'
import type { Allergen } from '@/config/allergens'
import { INGREDIENT_COMPARATORS, DEFAULT_INGREDIENT_COMPARATOR } from '@/config/ingredients'
import { NUTRIENT_UNITS, NUTRIENT_UNIT_LABELS, DEFAULT_NUTRIENT_UNIT } from '@/config/nutrients'
import type { NutrientUnit } from '@/config/nutrients'
import {
  ENERGY_UNITS,
  ENERGY_UNIT_LABELS,
  DEFAULT_ENERGY_UNIT,
  JOULES_PER_ENERGY_UNIT,
} from '@/config/energy'
import type { EnergyUnit } from '@/config/energy'
import { exceedsWholeFraction } from '@/config/exceedsWholeFraction'
import { isLikelyNonVeganIngredient } from '@/config/isLikelyNonVeganIngredient'
import { sumGuaranteedFractionBasisPoints } from '@/config/sumGuaranteedFractionBasisPoints'
import { parsePercentInputToBasisPoints } from '@/lib/parsePercentInputToBasisPoints'
import { formatFractionBasisPointsAsPercent } from '@/lib/formatFractionBasisPointsAsPercent'
import { parseNutrientAmountInputToMicrograms } from '@/lib/parseNutrientAmountInputToMicrograms'
import { chooseNutrientDisplayUnit, formatNutrientAmountValue } from '@/lib/formatNutrientAmount'
import { sortNutrientsByHierarchy } from '@/lib/sortNutrientsByHierarchy'
import { hasDuplicateNames } from '@/lib/hasDuplicateNames'
import { parseEnergyInputToJoules } from '@/lib/parseEnergyInputToJoules'
import { useNameSuggestions } from '@/composables/useNameSuggestions'
import {
  searchSimilarProducts,
  fetchIngredientNameSuggestions,
  fetchNutrientNameSuggestions,
} from '@/services/products'
import { getImageUrl } from '@/services/catalog'
import { ImageSize } from '@/config/imageSizes'
import type { Product, ProductImage } from '@/types'
import type { ImageCopyGroup } from '@/types/ImageCopyGroup'
import FieldComparisonRow from '@/components/FieldComparisonRow.vue'
import { ComparedField } from '@/types/ComparedField'
import { ComparisonSide } from '@/types/ComparisonSide'
import { comparedFieldToLabel } from '@/lib/comparedFieldToLabel'
import { formatComparedFieldValue, formatComparedAllergen } from '@/lib/formatComparedFieldValue'
import { formatComparedIngredients } from '@/lib/formatComparedIngredients'
import { formatComparedNutrients } from '@/lib/formatComparedNutrients'
import type {
  ProductFormValues,
  ProductFormComparison,
  ProductFormIngredient,
  ProductFormInitialNutrient,
  ProductFormInitialValues,
  ProductFormNutrient,
} from '@/types/productForm'

const props = withDefaults(
  defineProps<{
    initial?: ProductFormInitialValues
    existingImages?: ProductImage[]
    submitting?: boolean
    submitLabel?: string
    comparison?: ProductFormComparison
    imageCopySources?: ImageCopyGroup[]
  }>(),
  { existingImages: () => [], submitLabel: 'Speichern', imageCopySources: () => [] },
)

const emit = defineEmits<{
  submit: [values: ProductFormValues]
  filesChanged: [files: File[]]
  deleteImage: [image: ProductImage]
  copySelectionChanged: [imageIds: string[]]
}>()

const name = ref(props.initial?.name ?? '')
const category = ref(props.initial?.category ?? '')
const base = ref(props.initial?.base ?? '')
const brand = ref(props.initial?.brand ?? '')
const description = ref(props.initial?.description ?? '')
const allergens = ref<Allergen[]>(props.initial?.allergens ? [...props.initial.allergens] : [])
const isOrganic = ref(props.initial?.isOrganic ?? false)
const barcode = ref(props.initial?.barcode ?? '')

const toggleAllergen = (allergen: Allergen): void => {
  const idx = allergens.value.indexOf(allergen)
  if (idx === -1) allergens.value = [...allergens.value, allergen]
  else allergens.value = allergens.value.filter((a) => a !== allergen)
}

const toEnergyInput = (energyJoules: number | null | undefined): string =>
  energyJoules != null ? String(energyJoules / JOULES_PER_ENERGY_UNIT[DEFAULT_ENERGY_UNIT]) : ''

const energyInput = ref(toEnergyInput(props.initial?.energyJoules))
const energyUnit = ref<EnergyUnit>(DEFAULT_ENERGY_UNIT)

const parsedEnergyJoules = computed(() =>
  parseEnergyInputToJoules(energyInput.value, energyUnit.value),
)

const hasInvalidEnergy = computed(
  () => energyInput.value.trim().length > 0 && parsedEnergyJoules.value === null,
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
const { suggestions: ingredientSuggestions } = useNameSuggestions(fetchIngredientNameSuggestions)

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

const hasDuplicateIngredientNames = computed(() =>
  hasDuplicateNames(ingredientRows.value.map((row) => row.name)),
)

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

const toNutrientRow = (nutrient: ProductFormInitialNutrient): NutrientRow => {
  if (nutrient.amountMicrograms === null) {
    return {
      key: crypto.randomUUID(),
      name: nutrient.name,
      amountInput: '',
      unit: DEFAULT_NUTRIENT_UNIT,
    }
  }
  const unit = chooseNutrientDisplayUnit(nutrient.amountMicrograms)
  return {
    key: crypto.randomUUID(),
    name: nutrient.name,
    amountInput: formatNutrientAmountValue(nutrient.amountMicrograms, unit),
    unit,
  }
}

const nutrientRows = ref<NutrientRow[]>(
  sortNutrientsByHierarchy(props.initial?.nutrients ?? []).map(toNutrientRow),
)
const { suggestions: nutrientSuggestions } = useNameSuggestions(fetchNutrientNameSuggestions)

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

const hasDuplicateNutrientNames = computed(() =>
  hasDuplicateNames(nutrientRows.value.map((row) => row.name)),
)

type SimilarProduct = Pick<Product, 'id' | 'name' | 'brand' | 'category'>
const similarProducts = ref<SimilarProduct[]>([])
let dedupeTimer: ReturnType<typeof setTimeout> | undefined

watch(name, (val) => {
  clearTimeout(dedupeTimer)
  if (props.comparison || val.trim().length < 3) {
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
    energyJoules: parsedEnergyJoules.value,
    allergens: allergens.value,
    isOrganic: isOrganic.value,
    barcode: barcode.value.trim() || null,
    ingredients: parsedIngredients.value,
    nutrients: parsedNutrients.value,
  })
}

const comparisonValues = (side: ComparisonSide): ProductFormValues | undefined =>
  side === ComparisonSide.A ? props.comparison?.a : props.comparison?.b

const comparedProps = (field: ComparedField) => ({
  comparing: !!props.comparison,
  fieldLabel: comparedFieldToLabel(field),
  valueA: props.comparison ? formatComparedFieldValue(field, props.comparison.a) : '',
  valueB: props.comparison ? formatComparedFieldValue(field, props.comparison.b) : '',
})

const comparedAllergenProps = (allergen: Allergen) => ({
  comparing: !!props.comparison,
  fieldLabel: allergenToLabel(allergen),
  valueA: props.comparison ? formatComparedAllergen(allergen, props.comparison.a) : '',
  valueB: props.comparison ? formatComparedAllergen(allergen, props.comparison.b) : '',
})

const acceptField = (field: ComparedField, side: ComparisonSide): void => {
  const source = comparisonValues(side)
  if (!source) return
  switch (field) {
    case ComparedField.Barcode:
      barcode.value = source.barcode ?? ''
      break
    case ComparedField.Name:
      name.value = source.name
      break
    case ComparedField.Category:
      category.value = source.category
      break
    case ComparedField.Brand:
      brand.value = source.brand ?? ''
      break
    case ComparedField.Description:
      description.value = source.description ?? ''
      break
    case ComparedField.IsOrganic:
      isOrganic.value = source.isOrganic
      break
    case ComparedField.Base:
      base.value = source.base ?? ''
      break
    case ComparedField.Energy:
      energyUnit.value = DEFAULT_ENERGY_UNIT
      energyInput.value = toEnergyInput(source.energyJoules)
      break
  }
}

const acceptAllergen = (allergen: Allergen, side: ComparisonSide): void => {
  const source = comparisonValues(side)
  if (!source) return
  const isAccepted = allergens.value.includes(allergen)
  if (source.allergens.includes(allergen) !== isAccepted) toggleAllergen(allergen)
}

const INGREDIENTS_LABEL = 'Zutaten'
const NUTRIENTS_LABEL = 'Nährwerte'

const ingredientComparisonProps = computed(() => ({
  comparing: !!props.comparison,
  fieldLabel: INGREDIENTS_LABEL,
  valueA: props.comparison ? formatComparedIngredients(props.comparison.a.ingredients) : '',
  valueB: props.comparison ? formatComparedIngredients(props.comparison.b.ingredients) : '',
}))

const nutrientComparisonProps = computed(() => ({
  comparing: !!props.comparison,
  fieldLabel: NUTRIENTS_LABEL,
  valueA: props.comparison ? formatComparedNutrients(props.comparison.a.nutrients) : '',
  valueB: props.comparison ? formatComparedNutrients(props.comparison.b.nutrients) : '',
}))

const acceptIngredients = (side: ComparisonSide): void => {
  const source = comparisonValues(side)
  if (!source) return
  ingredientRows.value = source.ingredients.map(toRow)
}

const acceptNutrients = (side: ComparisonSide): void => {
  const source = comparisonValues(side)
  if (!source) return
  nutrientRows.value = sortNutrientsByHierarchy(source.nutrients).map(toNutrientRow)
}

const imageUploadRef = ref<InstanceType<typeof ImageUpload> | null>(null)

const applyScannedValues = (values: Partial<ProductFormValues>): void => {
  if (values.name !== undefined) name.value = values.name
  if (typeof values.brand === 'string') brand.value = values.brand
  if (typeof values.description === 'string') description.value = values.description
  if (typeof values.energyJoules === 'number') {
    energyUnit.value = DEFAULT_ENERGY_UNIT
    energyInput.value = String(values.energyJoules / JOULES_PER_ENERGY_UNIT[DEFAULT_ENERGY_UNIT])
  }
  if (values.allergens !== undefined) allergens.value = [...values.allergens]
  if (values.isOrganic !== undefined) isOrganic.value = values.isOrganic
  if (typeof values.barcode === 'string') barcode.value = values.barcode
  if (values.ingredients !== undefined) ingredientRows.value = values.ingredients.map(toRow)
  if (values.nutrients !== undefined)
    nutrientRows.value = sortNutrientsByHierarchy(values.nutrients).map(toNutrientRow)
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <ProductBarcodeScanner
      v-if="!comparison"
      @scanned="applyScannedValues"
      @scanned-image="(file) => imageUploadRef?.addFile(file)"
    />

    <FieldComparisonRow
      v-bind="comparedProps(ComparedField.Barcode)"
      @accept-a="acceptField(ComparedField.Barcode, ComparisonSide.A)"
      @accept-b="acceptField(ComparedField.Barcode, ComparisonSide.B)"
    >
      <div v-if="barcode || comparison">
        <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-barcode">
          Barcode
        </label>
        <div class="flex gap-2">
          <input
            id="pf-barcode"
            v-model="barcode"
            type="text"
            inputmode="numeric"
            class="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            class="px-3 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Barcode entfernen"
            @click="barcode = ''"
          >
            Entfernen
          </button>
        </div>
      </div>
    </FieldComparisonRow>

    <FieldComparisonRow
      v-bind="comparedProps(ComparedField.Name)"
      @accept-a="acceptField(ComparedField.Name, ComparisonSide.A)"
      @accept-b="acceptField(ComparedField.Name, ComparisonSide.B)"
    >
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
          v-if="similarProducts.length && !comparison"
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
    </FieldComparisonRow>

    <FieldComparisonRow
      v-bind="comparedProps(ComparedField.Category)"
      @accept-a="acceptField(ComparedField.Category, ComparisonSide.A)"
      @accept-b="acceptField(ComparedField.Category, ComparisonSide.B)"
    >
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
            {{ categoryToLabel(cat) }}
          </option>
        </select>
      </div>
    </FieldComparisonRow>

    <FieldComparisonRow
      v-bind="comparedProps(ComparedField.Brand)"
      @accept-a="acceptField(ComparedField.Brand, ComparisonSide.A)"
      @accept-b="acceptField(ComparedField.Brand, ComparisonSide.B)"
    >
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-brand">
          Marke / Hersteller
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
    </FieldComparisonRow>

    <FieldComparisonRow
      v-bind="comparedProps(ComparedField.Description)"
      @accept-a="acceptField(ComparedField.Description, ComparisonSide.A)"
      @accept-b="acceptField(ComparedField.Description, ComparisonSide.B)"
    >
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-description">
          Beschreibung
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
    </FieldComparisonRow>

    <FieldComparisonRow
      v-bind="comparedProps(ComparedField.IsOrganic)"
      @accept-a="acceptField(ComparedField.IsOrganic, ComparisonSide.A)"
      @accept-b="acceptField(ComparedField.IsOrganic, ComparisonSide.B)"
    >
      <div class="flex items-center gap-2">
        <input id="pf-organic" v-model="isOrganic" type="checkbox" class="h-4 w-4 rounded" />
        <label class="text-sm font-medium text-gray-700" for="pf-organic">Bio-Produkt</label>
      </div>
    </FieldComparisonRow>

    <FieldComparisonRow
      v-bind="comparedProps(ComparedField.Base)"
      @accept-a="acceptField(ComparedField.Base, ComparisonSide.A)"
      @accept-b="acceptField(ComparedField.Base, ComparisonSide.B)"
    >
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-base">Basis</label>
        <select
          id="pf-base"
          v-model="base"
          class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">Keine Angabe</option>
          <option v-for="b in BASES" :key="b" :value="b">
            {{ baseToLabel(b) }}
          </option>
        </select>
      </div>
    </FieldComparisonRow>

    <div>
      <p class="text-sm font-medium text-gray-700 mb-1.5">Allergene</p>
      <div :class="comparison ? 'space-y-2' : 'flex flex-wrap gap-2'">
        <FieldComparisonRow
          v-for="allergen in ALLERGENS"
          :key="allergen"
          v-bind="comparedAllergenProps(allergen)"
          @accept-a="acceptAllergen(allergen, ComparisonSide.A)"
          @accept-b="acceptAllergen(allergen, ComparisonSide.B)"
        >
          <button
            type="button"
            class="px-3 py-1.5 rounded-full text-sm transition-colors"
            :class="
              allergens.includes(allergen)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
            @click="toggleAllergen(allergen)"
          >
            {{ allergenToLabel(allergen) }}
          </button>
        </FieldComparisonRow>
      </div>
    </div>

    <FieldComparisonRow
      v-bind="ingredientComparisonProps"
      @accept-a="acceptIngredients(ComparisonSide.A)"
      @accept-b="acceptIngredients(ComparisonSide.B)"
    >
      <div>
        <p class="text-sm font-medium text-gray-700 mb-1.5">{{ INGREDIENTS_LABEL }}</p>
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
        <div v-for="row in ingredientRows" :key="row.key" class="flex gap-2 mb-2">
          <SuggestionTextInput
            v-model="row.name"
            :suggestions="ingredientSuggestions"
            :maxlength="80"
            placeholder="z. B. Hafer"
            class="flex-1 min-w-0"
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
        <button
          type="button"
          class="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
          @click="addIngredientRow"
        >
          + Zutat hinzufügen
        </button>
      </div>
    </FieldComparisonRow>

    <FieldComparisonRow
      v-bind="comparedProps(ComparedField.Energy)"
      @accept-a="acceptField(ComparedField.Energy, ComparisonSide.A)"
      @accept-b="acceptField(ComparedField.Energy, ComparisonSide.B)"
    >
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5" for="pf-energy">
          Energie
          <span class="text-xs text-gray-400 font-normal">(pro 100 g/ml)</span>
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
    </FieldComparisonRow>

    <FieldComparisonRow
      v-bind="nutrientComparisonProps"
      @accept-a="acceptNutrients(ComparisonSide.A)"
      @accept-b="acceptNutrients(ComparisonSide.B)"
    >
      <div>
        <p class="text-sm font-medium text-gray-700 mb-1.5">
          {{ NUTRIENTS_LABEL }}
          <span class="text-xs text-gray-400 font-normal">(pro 100 g/ml)</span>
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
        <div v-for="row in nutrientRows" :key="row.key" class="flex gap-2 mb-2">
          <SuggestionTextInput
            v-model="row.name"
            :suggestions="nutrientSuggestions"
            :maxlength="80"
            placeholder="z. B. Ballaststoffe"
            class="flex-1 min-w-0"
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
        <button
          type="button"
          class="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
          @click="addNutrientRow"
        >
          + Nährwert hinzufügen
        </button>
      </div>
    </FieldComparisonRow>

    <div v-if="existingImages.length && !comparison">
      <p class="text-sm font-medium text-gray-700 mb-2">Vorhandene Bilder</p>
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="img in existingImages"
          :key="img.id"
          class="relative rounded-lg overflow-hidden bg-gray-100"
        >
          <Image
            :src="getImageUrl('product-images', img.storage_path, ImageSize.Thumbnail)"
            alt=""
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

    <div v-if="!comparison">
      <p class="text-sm font-medium text-gray-700 mb-2">
        {{ existingImages.length ? 'Weitere Bilder hinzufügen' : 'Bilder' }}
      </p>
      <ImageUpload ref="imageUploadRef" @change="emit('filesChanged', $event)" />
    </div>

    <ImageCopyPicker
      v-if="!comparison"
      title="Bilder aus Bewertungen übernehmen"
      bucket="review-images"
      :groups="imageCopySources"
      @change="emit('copySelectionChanged', $event)"
    />

    <slot name="extras" />

    <button
      type="submit"
      :disabled="submitting"
      class="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
    >
      {{ submitting ? 'Wird gespeichert …' : submitLabel }}
    </button>
  </form>
</template>
