<script setup lang="ts">
import { ref } from 'vue'
import { STORE_SUGGESTIONS } from '@/config/taxonomy'
import { parseEurosToCents } from '@/lib/price'

export interface PriceReportFormValues {
  store: string
  cityName: string
  priceEuroCents: number
  salePriceEuroCents: number | null
  observedAt: string
}

const emit = defineEmits<{
  submit: [values: PriceReportFormValues]
}>()

const store = ref('')
const cityName = ref('')
const priceText = ref('')
const salePriceText = ref('')
const observedAt = ref(new Date().toISOString().slice(0, 10))

const error = ref<string | null>(null)

function handleSubmit(): void {
  const priceEuroCents = parseEurosToCents(priceText.value)
  if (!store.value.trim() || priceEuroCents === null) {
    error.value = 'Bitte Geschäft und gültigen Preis angeben.'
    return
  }
  const salePriceEuroCents = salePriceText.value.trim()
    ? parseEurosToCents(salePriceText.value)
    : null
  error.value = null
  emit('submit', {
    store: store.value.trim(),
    cityName: cityName.value.trim(),
    priceEuroCents,
    salePriceEuroCents,
    observedAt: observedAt.value,
  })
  priceText.value = ''
  salePriceText.value = ''
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1" for="prf-store">
          Geschäft <span class="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="prf-store"
          v-model="store"
          type="text"
          list="prf-store-suggestions"
          maxlength="80"
          required
          placeholder="z. B. REWE"
          class="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <datalist id="prf-store-suggestions">
          <option v-for="s in STORE_SUGGESTIONS" :key="s" :value="s" />
        </datalist>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1" for="prf-city">
          Stadt
          <span class="text-xs text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="prf-city"
          v-model="cityName"
          type="text"
          maxlength="80"
          placeholder="z. B. Berlin"
          class="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1" for="prf-price">
          Preis (€) <span class="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="prf-price"
          v-model="priceText"
          type="text"
          inputmode="decimal"
          pattern="[0-9]+([.,][0-9]{1,2})?"
          maxlength="8"
          required
          placeholder="z. B. 2,99"
          class="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1" for="prf-sale-price">
          Angebotspreis (€)
          <span class="text-xs text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="prf-sale-price"
          v-model="salePriceText"
          type="text"
          inputmode="decimal"
          pattern="[0-9]+([.,][0-9]{1,2})?"
          maxlength="8"
          placeholder="z. B. 1,99"
          class="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>

    <div>
      <label class="block text-xs font-medium text-gray-600 mb-1" for="prf-date">
        Gesehen am
      </label>
      <input
        id="prf-date"
        v-model="observedAt"
        type="date"
        class="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>

    <p v-if="error" role="alert" class="text-xs text-red-600">{{ error }}</p>

    <button
      type="submit"
      class="w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
    >
      Preis eintragen
    </button>
  </form>
</template>
