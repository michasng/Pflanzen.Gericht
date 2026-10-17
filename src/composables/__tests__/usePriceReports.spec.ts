import { describe, expect, it } from 'vitest'
import type { PriceReportFormValues } from '@/components/PriceReportForm.vue'
import { createFakeProductDetailGateway } from '@/__tests__/createFakeProductDetailGateway'
import { createPriceReport } from '@/__tests__/createPriceReport'
import type { PriceReportWithProfile } from '@/services/prices'
import { usePriceReports } from '../usePriceReports'

const USER_ID = 'user-1'

const createValues = (overrides: Partial<PriceReportFormValues> = {}): PriceReportFormValues => ({
  store: 'Rewe',
  cityName: 'Berlin',
  priceEuroCents: 249,
  salePriceEuroCents: null,
  observedAt: '2026-09-12',
  ...overrides,
})

const createPriceReports = ({
  initialReports = [] as readonly PriceReportWithProfile[],
  currentUserId = USER_ID as string | null,
  gateway = createFakeProductDetailGateway(),
} = {}) =>
  usePriceReports({
    gateway,
    productId: 'product-1',
    currentUserId: () => currentUserId,
    initialReports,
  })

describe('usePriceReports', () => {
  describe('when showing the form', () => {
    it('makes the form visible', () => {
      const { isFormVisible, showForm } = createPriceReports()

      showForm()

      expect(isFormVisible.value).toBe(true)
    })
  })

  describe('when saving a report', () => {
    it('passes the values to the gateway', async () => {
      const saveCalls: unknown[][] = []
      const { save } = createPriceReports({
        gateway: createFakeProductDetailGateway({
          upsertPriceReport: (...args) => {
            saveCalls.push(args)
            return Promise.resolve(createPriceReport())
          },
        }),
      })

      await save(createValues({ salePriceEuroCents: 199 }))

      expect(saveCalls).toEqual([['product-1', USER_ID, 'Rewe', 'Berlin', 249, 199, '2026-09-12']])
    })

    it('puts the saved report first and hides the form', async () => {
      const existing = createPriceReport({ id: 'existing', store: 'Lidl' })
      const saved = createPriceReport({ id: 'saved' })
      const { priceReports, isFormVisible, showForm, save } = createPriceReports({
        initialReports: [existing],
        gateway: createFakeProductDetailGateway({
          upsertPriceReport: () => Promise.resolve(saved),
        }),
      })
      showForm()

      await save(createValues())

      expect(priceReports.value).toEqual([saved, existing])
      expect(isFormVisible.value).toBe(false)
    })

    it('replaces the list instead of changing it in place', async () => {
      const initialReports = [createPriceReport({ id: 'existing', store: 'Lidl' })]
      const { priceReports, save } = createPriceReports({
        initialReports,
        gateway: createFakeProductDetailGateway({
          upsertPriceReport: () => Promise.resolve(createPriceReport({ id: 'saved' })),
        }),
      })

      await save(createValues())

      expect(initialReports).toHaveLength(1)
      expect(priceReports.value).not.toBe(initialReports)
    })

    it('given an earlier report by the same user for the same store and city then replaces it', async () => {
      const earlier = createPriceReport({ id: 'earlier' })
      const other = createPriceReport({ id: 'other', store: 'Lidl' })
      const saved = createPriceReport({ id: 'saved', priceEuroCents: 249 })
      const { priceReports, save } = createPriceReports({
        initialReports: [other, earlier],
        gateway: createFakeProductDetailGateway({
          upsertPriceReport: () => Promise.resolve(saved),
        }),
      })

      await save(createValues())

      expect(priceReports.value).toEqual([other, saved])
    })

    it('given a failing gateway then provides the error and keeps the form open', async () => {
      const { errorMessage, isFormVisible, priceReports, showForm, save } = createPriceReports({
        gateway: createFakeProductDetailGateway({
          upsertPriceReport: () => Promise.reject(new Error('no permission')),
        }),
      })
      showForm()

      await save(createValues())

      expect(errorMessage.value).toBe('no permission')
      expect(isFormVisible.value).toBe(true)
      expect(priceReports.value).toEqual([])
    })

    it('given nobody is signed in then does nothing', async () => {
      const saveCalls: unknown[][] = []
      const { priceReports, save } = createPriceReports({
        currentUserId: null,
        gateway: createFakeProductDetailGateway({
          upsertPriceReport: (...args) => {
            saveCalls.push(args)
            return Promise.resolve(createPriceReport())
          },
        }),
      })

      await save(createValues())

      expect(saveCalls).toEqual([])
      expect(priceReports.value).toEqual([])
    })
  })

  describe('when deleting a report', () => {
    it('removes it from the list without changing the original', async () => {
      const keep = createPriceReport({ id: 'keep' })
      const initialReports = [createPriceReport({ id: 'gone' }), keep]
      const deletedIds: string[] = []
      const { priceReports, remove } = createPriceReports({
        initialReports,
        gateway: createFakeProductDetailGateway({
          deletePriceReport: (id) => {
            deletedIds.push(id)
            return Promise.resolve()
          },
        }),
      })

      await remove('gone')

      expect(deletedIds).toEqual(['gone'])
      expect(priceReports.value).toEqual([keep])
      expect(initialReports).toHaveLength(2)
    })

    it('given a failing gateway then provides the error and keeps the report', async () => {
      const report = createPriceReport({ id: 'kept' })
      const { priceReports, errorMessage, remove } = createPriceReports({
        initialReports: [report],
        gateway: createFakeProductDetailGateway({
          deletePriceReport: () => Promise.reject(new Error('no permission')),
        }),
      })

      await remove('kept')

      expect(errorMessage.value).toBe('no permission')
      expect(priceReports.value).toEqual([report])
    })
  })
})
