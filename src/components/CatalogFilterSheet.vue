<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import StarRatingInput from '@/components/StarRatingInput.vue'
import { BASES, BASE_LABELS, STORE_SUGGESTIONS, TAG_GROUPS, TAG_LABELS } from '@/config/taxonomy'
import type { Base, Tag } from '@/config/taxonomy'
import { parseEurosToCents, formatEuroCents } from '@/lib/price'
import { supabase } from '@/lib/supabase'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const catalogStore = useCatalogStore()

// local draft — only applied on "Anwenden"
const draftMinRating = ref<number | null>(catalogStore.minRating)
const draftBase = ref<string | null>(catalogStore.base)
const draftStore = ref<string | null>(catalogStore.store)
const draftCity = ref<string | null>(catalogStore.city)
const draftTags = ref<string[]>([...catalogStore.tags])
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

const cities = ref<string[]>([])

async function loadCities(store: string | null): Promise<void> {
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
    draftMinPriceInput.value =
      catalogStore.minPriceCents != null
        ? formatEuroCents(catalogStore.minPriceCents).replace(' €', '')
        : ''
    draftMaxPriceInput.value =
      catalogStore.maxPriceCents != null
        ? formatEuroCents(catalogStore.maxPriceCents).replace(' €', '')
        : ''
    void loadCities(catalogStore.store)
  },
)

function toggleTag(tag: string): void {
  const idx = draftTags.value.indexOf(tag)
  if (idx === -1) draftTags.value = [...draftTags.value, tag]
  else draftTags.value = draftTags.value.filter((t) => t !== tag)
}

const hasChanges = computed(
  () =>
    draftMinRating.value !== catalogStore.minRating ||
    draftBase.value !== catalogStore.base ||
    draftStore.value !== catalogStore.store ||
    draftCity.value !== catalogStore.city ||
    JSON.stringify(draftTags.value.slice().sort()) !==
      JSON.stringify(catalogStore.tags.slice().sort()) ||
    draftMinPriceInput.value !==
      (catalogStore.minPriceCents != null
        ? formatEuroCents(catalogStore.minPriceCents).replace(' €', '')
        : '') ||
    draftMaxPriceInput.value !==
      (catalogStore.maxPriceCents != null
        ? formatEuroCents(catalogStore.maxPriceCents).replace(' €', '')
        : ''),
)

function apply(): void {
  catalogStore.setMinRating(draftMinRating.value)
  catalogStore.setBase(draftBase.value)
  catalogStore.setStore(draftStore.value)
  catalogStore.setCity(draftCity.value)
  catalogStore.setTags(draftTags.value)
  catalogStore.setMinPriceCents(parseEurosToCents(draftMinPriceInput.value) ?? null)
  catalogStore.setMaxPriceCents(parseEurosToCents(draftMaxPriceInput.value) ?? null)
  catalogStore.load(true)
  emit('close')
}

function reset(): void {
  draftMinRating.value = null
  draftBase.value = null
  draftStore.value = null
  draftCity.value = null
  draftTags.value = []
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
        class="fixed inset-0 z-40 bg-black/30"
        aria-label="Filter schließen"
        @click="emit('close')"
      ></button>

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
          <button
            type="button"
            class="text-sm text-primary-600 font-medium"
            :disabled="!hasChanges && !catalogStore.activeFilterCount"
            @click="reset"
          >
            Zurücksetzen
          </button>
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

          <!-- Tags grouped -->
          <section v-for="group in TAG_GROUPS" :key="group.label">
            <h3 class="text-sm font-medium text-gray-700 mb-2">{{ group.label }}</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in group.tags"
                :key="tag"
                type="button"
                class="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
                :class="
                  draftTags.includes(tag)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                "
                @click="toggleTag(tag)"
              >
                {{ TAG_LABELS[tag as Tag] }}
              </button>
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

          <!-- Base -->
          <section>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Basis</h3>
            <select
              v-model="draftBase"
              class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option :value="null">Alle</option>
              <option v-for="base in BASES" :key="base" :value="base">
                {{ BASE_LABELS[base as Base] }}
              </option>
            </select>
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
          <button
            type="button"
            class="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
            @click="apply"
          >
            Anwenden
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
