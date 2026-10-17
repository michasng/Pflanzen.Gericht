<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useProductDetailGateway } from '@/composables/useProductDetailGateway'
import { usePriceReports } from '@/composables/usePriceReports'
import { formatEuroCents } from '@/lib/price'
import type { PriceReportWithProfile } from '@/services/prices'
import PriceReportForm from '@/components/PriceReportForm.vue'
import SectionCard from '@/components/SectionCard.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'

const props = defineProps<{
  productId: string
  initialReports: readonly PriceReportWithProfile[]
  currentUserId: string | null
}>()

const route = useRoute()

const { priceReports, isFormVisible, errorMessage, showForm, save, remove } = usePriceReports({
  gateway: useProductDetailGateway(),
  productId: props.productId,
  currentUserId: () => props.currentUserId,
  initialReports: props.initialReports,
})
</script>

<template>
  <SectionCard title="Preise" :count="priceReports.length">
    <template #action>
      <Button
        v-if="currentUserId && !isFormVisible"
        :variant="ButtonVariant.Text"
        :size="ButtonSize.Small"
        ariaLabel="Preis eintragen"
        @click="showForm"
      >
        + Preis eintragen
      </Button>
    </template>

    <PriceReportForm v-if="isFormVisible" @submit="save" />
    <p v-if="errorMessage" role="alert" class="mt-2 text-xs text-red-600">
      {{ errorMessage }}
    </p>

    <p v-if="!priceReports.length && !isFormVisible" class="text-sm text-gray-400 text-center py-2">
      Noch keine Preise eingetragen.
      <template v-if="!currentUserId">
        <RouterLink
          :to="{ name: 'login', query: { redirect: route.fullPath } }"
          class="text-primary-600 hover:underline"
        >
          Anmelden
        </RouterLink>
        zum Eintragen.
      </template>
    </p>

    <ul v-if="priceReports.length" class="divide-y divide-gray-50 mt-1">
      <li
        v-for="report in priceReports"
        :key="report.id"
        class="flex items-center justify-between py-2 text-sm"
      >
        <div>
          <span class="font-medium text-gray-800">{{ report.store }}</span>
          <span v-if="report.cityName" class="text-gray-400 ml-1 text-xs">
            · {{ report.cityName }}
          </span>
          <span class="ml-2 font-semibold text-gray-900">
            {{ formatEuroCents(report.effectivePriceEuroCents ?? report.priceEuroCents) }}
          </span>
          <span
            v-if="report.salePriceEuroCents != null"
            class="ml-1 line-through text-gray-400 text-xs"
          >
            {{ formatEuroCents(report.priceEuroCents) }}
          </span>
        </div>
        <div class="flex items-center gap-3 text-xs text-gray-400">
          <span>{{ report.observedAt }}</span>
          <Button
            v-if="currentUserId && report.userId === currentUserId"
            :variant="ButtonVariant.Text"
            :size="ButtonSize.Small"
            :tone="ButtonTone.Danger"
            ariaLabel="Eintrag löschen"
            @click="remove(report.id)"
          >
            ✕
          </Button>
        </div>
      </li>
    </ul>
  </SectionCard>
</template>
