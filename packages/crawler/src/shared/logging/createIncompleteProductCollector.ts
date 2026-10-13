import type { IncompleteProduct } from '../../schema/incompleteProduct.js'

export interface IncompleteProductRecorder {
  record(incompleteProduct: IncompleteProduct): void
}

export interface IncompleteProductCollector extends IncompleteProductRecorder {
  list(): readonly IncompleteProduct[]
}

export const createIncompleteProductCollector = (): IncompleteProductCollector => {
  const incompleteProducts: IncompleteProduct[] = []
  return {
    record: (incompleteProduct) => {
      incompleteProducts.push(incompleteProduct)
    },
    list: () => incompleteProducts,
  }
}
