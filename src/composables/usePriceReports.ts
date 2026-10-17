import { ref, shallowRef } from 'vue'
import type { PriceReportFormValues } from '@/components/PriceReportForm.vue'
import { toErrorMessage } from '@/lib/error'
import type { ProductDetailGateway } from '@/services/ProductDetailGateway'
import type { PriceReportWithProfile } from '@/services/prices'

interface PriceReportsOptions {
  gateway: Pick<ProductDetailGateway, 'upsertPriceReport' | 'deletePriceReport'>
  productId: string
  currentUserId: () => string | null
  initialReports: readonly PriceReportWithProfile[]
}

export const usePriceReports = ({
  gateway,
  productId,
  currentUserId,
  initialReports,
}: PriceReportsOptions) => {
  const priceReports = shallowRef<readonly PriceReportWithProfile[]>(initialReports)
  const isFormVisible = ref(false)
  const errorMessage = ref<string | null>(null)

  const showForm = (): void => {
    isFormVisible.value = true
  }

  const save = async (values: PriceReportFormValues): Promise<void> => {
    const userId = currentUserId()
    if (!userId) return

    errorMessage.value = null
    try {
      const saved = await gateway.upsertPriceReport(
        productId,
        userId,
        values.store,
        values.cityName,
        values.priceEuroCents,
        values.salePriceEuroCents,
        values.observedAt,
      )
      const isReplaced = (report: PriceReportWithProfile): boolean =>
        report.userId === userId &&
        report.store === values.store &&
        report.cityName === values.cityName
      const isReplacing = priceReports.value.some(isReplaced)
      priceReports.value = isReplacing
        ? priceReports.value.map((report) => (isReplaced(report) ? saved : report))
        : [saved, ...priceReports.value]
      isFormVisible.value = false
    } catch (err) {
      errorMessage.value = toErrorMessage(err)
    }
  }

  const remove = async (priceReportId: string): Promise<void> => {
    errorMessage.value = null
    try {
      await gateway.deletePriceReport(priceReportId)
      priceReports.value = priceReports.value.filter((report) => report.id !== priceReportId)
    } catch (err) {
      errorMessage.value = toErrorMessage(err)
    }
  }

  return { priceReports, isFormVisible, errorMessage, showForm, save, remove }
}
