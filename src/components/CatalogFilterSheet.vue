<script setup lang="ts">
import { ref, watch, computed, type Ref } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import StarRatingInput from '@/components/StarRatingInput.vue'
import SuggestionTextInput from '@/components/SuggestionTextInput.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'
import Chip from '@/components/primitives/ChipComponent.vue'
import { ChipTone } from '@/components/primitives/ChipTone'
import { BASES, baseToLabel } from '@/config/bases'
import { STORE_SUGGESTIONS } from '@/config/storeSuggestions'
import { TAG_GROUPS } from '@/config/reviewTags'
import { ALLERGENS, allergenToLabel } from '@/config/allergens'
import { parseEurosToCents, formatEuroCents } from '@/lib/price'
import { supabase } from '@/lib/supabase'
import { useNameSuggestions } from '@/composables/useNameSuggestions'
import { fetchIngredientNameSuggestions } from '@/services/products'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const catalogStore = useCatalogStore()

// local draft — only applied on "Anwenden"
const draftMinRating = ref<number | null>(catalogStore.minRating)
const draftBase = ref<string | null>(catalogStore.base)
const draftStore = ref<string | null>(catalogStore.store)
const draftCity = ref<string | null>(catalogStore.city)
const draftTags = ref<string[]>([...catalogStore.tags])
const draftIncludeIngredients = ref<string[]>([...catalogStore.includeIngredients])
const draftExcludeIngredients = ref<string[]>([...catalogStore.excludeIngredients])
const draftExcludeAllergens = ref<string[]>([...catalogStore.excludeAllergens])
const draftOrganic = ref(catalogStore.organic)
const includeIngredientInput = ref('')
const excludeIngredientInput = ref('')
const { suggestions: ingredientSuggestions, refreshSuggestions } = useNameSuggestions(
  fetchIngredientNameSuggestions,
)
const draftMinPriceInput = ref(
  catalogStore.minPriceCents != null
    ? formatEuroCents(catalogStore.minPriceCents).replace(' €', '')
    : '',
)
const draftMaxPriceInput = ref(
  catalogStore.maxPriceCents != null
    ? formatEuroCents(catalogStore.maxPriceCents).replace(' €', '')
    : '',
)

const addIngredient = (list: Ref<string[]>, input: Ref<string>): void => {
  const name = input.value.trim()
  if (!name || list.value.includes(name)) {
    input.value = ''
    return
  }
  list.value = [...list.value, name]
  input.value = ''
}

const addIncludeIngredient = (): void =>
  addIngredient(draftIncludeIngredients, includeIngredientInput)
const addExcludeIngredient = (): void =>
  addIngredient(draftExcludeIngredients, excludeIngredientInput)

const removeIncludeIngredient = (name: string): void => {
  draftIncludeIngredients.value = draftIncludeIngredients.value.filter((n) => n !== name)
}

const removeExcludeIngredient = (name: string): void => {
  draftExcludeIngredients.value = draftExcludeIngredients.value.filter((n) => n !== name)
}

const cities = ref<string[]>([])

const loadCities = async (store: string | null): Promise<void> => {
  if (!store) {
    cities.value = []
    return
  }
  const { data } = await supabase
    .from('price_report')
    .select('city_name')
    .eq('store', store)
    .neq('city_name', '')
  cities.value = [...new Set((data ?? []).map((r) => r.city_name))].sort()
}

watch(
  () => draftStore.value,
  (s) => {
    void loadCities(s)
    draftCity.value = null
  },
)
watch(
  () => props.open,
  (v) => {
    if (!v) return
    // sync draft to current store state when sheet opens
    draftMinRating.value = catalogStore.minRating
    draftBase.value = catalogStore.base
    draftStore.value = catalogStore.store
    draftCity.value = catalogStore.city
    draftTags.value = [...catalogStore.tags]
    draftIncludeIngredients.value = [...catalogStore.includeIngredients]
    draftExcludeIngredients.value = [...catalogStore.excludeIngredients]
    draftExcludeAllergens.value = [...catalogStore.excludeAllergens]
    draftOrganic.value = catalogStore.organic
    draftMinPriceInput.value =
      catalogStore.minPriceCents != null
        ? formatEuroCents(catalogStore.minPriceCents).replace(' €', '')
        : ''
    draftMaxPriceInput.value =
      catalogStore.maxPriceCents != null
        ? formatEuroCents(catalogStore.maxPriceCents).replace(' €', '')
        : ''
    void loadCities(catalogStore.store)
    void refreshSuggestions()
  },
)

const toggleTag = (tag: string): void => {
  const idx = draftTags.value.indexOf(tag)
  if (idx === -1) draftTags.value = [...draftTags.value, tag]
  else draftTags.value = draftTags.value.filter((t) => t !== tag)
}

const toggleAllergen = (allergen: string): void => {
  const idx = draftExcludeAllergens.value.indexOf(allergen)
  if (idx === -1) draftExcludeAllergens.value = [...draftExcludeAllergens.value, allergen]
  else draftExcludeAllergens.value = draftExcludeAllergens.value.filter((a) => a !== allergen)
}

const hasChanges = computed(
  () =>
    draftMinRating.value !== catalogStore.minRating ||
    draftBase.value !== catalogStore.base ||
    draftStore.value !== catalogStore.store ||
    draftCity.value !== catalogStore.city ||
    JSON.stringify(draftTags.value.slice().sort()) !==
      JSON.stringify(catalogStore.tags.slice().sort()) ||
    JSON.stringify(draftIncludeIngredients.value.slice().sort()) !==
      JSON.stringify(catalogStore.includeIngredients.slice().sort()) ||
    JSON.stringify(draftExcludeIngredients.value.slice().sort()) !==
      JSON.stringify(catalogStore.excludeIngredients.slice().sort()) ||
    JSON.stringify(draftExcludeAllergens.value.slice().sort()) !==
      JSON.stringify(catalogStore.excludeAllergens.slice().sort()) ||
    draftOrganic.value !== catalogStore.organic ||
    draftMinPriceInput.value !==
      (catalogStore.minPriceCents != null
        ? formatEuroCents(catalogStore.minPriceCents).replace(' €', '')
        : '') ||
    draftMaxPriceInput.value !==
      (catalogStore.maxPriceCents != null
        ? formatEuroCents(catalogStore.maxPriceCents).replace(' €', '')
        : ''),
)

const apply = (): void => {
  catalogStore.setMinRating(draftMinRating.value)
  catalogStore.setBase(draftBase.value)
  catalogStore.setStore(draftStore.value)
  catalogStore.setCity(draftCity.value)
  catalogStore.setTags(draftTags.value)
  catalogStore.setIncludeIngredients(draftIncludeIngredients.value)
  catalogStore.setExcludeIngredients(draftExcludeIngredients.value)
  catalogStore.setExcludeAllergens(draftExcludeAllergens.value)
  catalogStore.setOrganic(draftOrganic.value)
  catalogStore.setMinPriceCents(parseEurosToCents(draftMinPriceInput.value) ?? null)
  catalogStore.setMaxPriceCents(parseEurosToCents(draftMaxPriceInput.value) ?? null)
  catalogStore.load(true)
  emit('close')
}

const reset = (): void => {
  draftMinRating.value = null
  draftBase.value = null
  draftStore.value = null
  draftCity.value = null
  draftTags.value = []
  draftIncludeIngredients.value = []
  draftExcludeIngredients.value = []
  draftExcludeAllergens.value = []
  draftOrganic.value = false
  draftMinPriceInput.value = ''
  draftMaxPriceInput.value = ''
  catalogStore.resetFilters()
  catalogStore.load(true)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open">
      <button
        type="button"
        aria-label="Filter schließen"
        class="fixed inset-0 z-40 bg-black/30"
        @click="emit('close')"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filteroptionen"
        class="fixed bottom-0 inset-x-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white pb-safe-or-6 shadow-xl"
      >
        <div
          class="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 border-b border-gray-100"
        >
          <h2 class="text-base font-semibold text-gray-900">Filter</h2>
          <Button
            type="button"
            ariaLabel="Zurücksetzen"
            :variant="ButtonVariant.Text"
            :size="ButtonSize.Compact"
            :disabled="!hasChanges && !catalogStore.activeFilterCount"
            @click="reset"
          >
            Zurücksetzen
          </Button>
        </div>

        <div class="px-4 py-4 space-y-6">
          <!-- Min rating -->
          <section>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Mindestbewertung</h3>
            <div class="flex items-center gap-3">
              <StarRatingInput v-model="draftMinRating" />
              <span v-if="draftMinRating" class="text-sm text-gray-500">
                ab {{ draftMinRating }} Stern{{ draftMinRating > 1 ? 'en' : '' }}
              </span>
            </div>
          </section>

          <!-- Review tags -->
          <section>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Bewertungs-Tags</h3>
            <div v-for="group in TAG_GROUPS" :key="group.label" class="mb-3 last:mb-0">
              <h4 class="text-xs font-medium text-gray-500 mb-1.5">{{ group.label }}</h4>
              <div class="flex flex-wrap gap-2">
                <Chip
                  v-for="(tagLabel, tag) in group.tags"
                  :key="tag"
                  interactive
                  :selected="draftTags.includes(tag)"
                  @click="toggleTag(tag)"
                >
                  {{ tagLabel }}
                </Chip>
              </div>
            </div>
          </section>

          <!-- Organic -->
          <section>
            <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input v-model="draftOrganic" type="checkbox" class="h-4 w-4 rounded" />
              Nur Bio-Produkte
            </label>
          </section>

          <!-- Base -->
          <section>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Basis</h3>
            <select
              v-model="draftBase"
              class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option :value="null">Alle</option>
              <option v-for="base in BASES" :key="base" :value="base">
                {{ baseToLabel(base) }}
              </option>
            </select>
          </section>

          <!-- Allergens -->
          <section>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Allergene ausschließen</h3>
            <div class="flex flex-wrap gap-2">
              <Chip
                v-for="allergen in ALLERGENS"
                :key="allergen"
                interactive
                :selected="draftExcludeAllergens.includes(allergen)"
                @click="toggleAllergen(allergen)"
              >
                {{ allergenToLabel(allergen) }}
              </Chip>
            </div>
          </section>

          <!-- Ingredients -->
          <section>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Zutaten enthalten</h3>
            <div class="flex gap-2 mb-2">
              <SuggestionTextInput
                v-model="includeIngredientInput"
                :suggestions="ingredientSuggestions"
                placeholder="z. B. Hafer"
                class="flex-1"
                @enter="addIncludeIngredient"
              />
              <Button
                type="button"
                ariaLabel="Zutat hinzufügen"
                :variant="ButtonVariant.Outlined"
                :tone="ButtonTone.Muted"
                :size="ButtonSize.Compact"
                @click="addIncludeIngredient"
              >
                +
              </Button>
            </div>
            <div v-if="draftIncludeIngredients.length" class="flex flex-wrap gap-2">
              <Chip
                v-for="ingredientName in draftIncludeIngredients"
                :key="ingredientName"
                selected
                removable
                :remove-label="`${ingredientName} entfernen`"
                @remove="removeIncludeIngredient(ingredientName)"
              >
                {{ ingredientName }}
              </Chip>
            </div>
          </section>

          <section>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Zutaten ausschließen</h3>
            <div class="flex gap-2 mb-2">
              <SuggestionTextInput
                v-model="excludeIngredientInput"
                :suggestions="ingredientSuggestions"
                placeholder="z. B. Palmöl"
                class="flex-1"
                @enter="addExcludeIngredient"
              />
              <Button
                type="button"
                ariaLabel="Ausschlusszutat hinzufügen"
                :variant="ButtonVariant.Outlined"
                :tone="ButtonTone.Muted"
                :size="ButtonSize.Compact"
                @click="addExcludeIngredient"
              >
                +
              </Button>
            </div>
            <div v-if="draftExcludeIngredients.length" class="flex flex-wrap gap-2">
              <Chip
                v-for="ingredientName in draftExcludeIngredients"
                :key="ingredientName"
                :tone="ChipTone.Danger"
                removable
                :remove-label="`${ingredientName} entfernen`"
                @remove="removeExcludeIngredient(ingredientName)"
              >
                {{ ingredientName }}
              </Chip>
            </div>
          </section>

          <!-- Price range -->
          <section>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Preis</h3>
            <div class="flex gap-2">
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1" for="fs-min-price">Ab (€)</label>
                <input
                  id="fs-min-price"
                  v-model="draftMinPriceInput"
                  type="text"
                  inputmode="decimal"
                  maxlength="8"
                  placeholder="0,00"
                  class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1" for="fs-max-price">Bis (€)</label>
                <input
                  id="fs-max-price"
                  v-model="draftMaxPriceInput"
                  type="text"
                  inputmode="decimal"
                  maxlength="8"
                  placeholder="z. B. 5,00"
                  class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </section>

          <!-- Store + City -->
          <section>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Geschäft</h3>
            <div class="space-y-2">
              <select
                v-model="draftStore"
                class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option :value="null">Alle Geschäfte</option>
                <option v-for="s in STORE_SUGGESTIONS" :key="s" :value="s">{{ s }}</option>
              </select>
              <select
                v-if="draftStore"
                v-model="draftCity"
                class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option :value="null">Alle Städte</option>
                <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
          </section>
        </div>

        <div class="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
          <Button
            type="button"
            ariaLabel="Anwenden"
            :variant="ButtonVariant.Filled"
            :size="ButtonSize.Large"
            full-width
            @click="apply"
          >
            Anwenden
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
