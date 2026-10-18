import type { InjectionKey } from 'vue'
import type { CatalogFilter, ProductPage } from '@/services/catalog'

export const catalogGatewayKey: InjectionKey<CatalogGateway> = Symbol('catalogGateway')

export interface CatalogGateway {
  fetchProducts: (filter: CatalogFilter, page: number) => Promise<ProductPage>
}
