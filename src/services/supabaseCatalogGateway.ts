import { fetchProducts } from '@/services/catalog'
import type { CatalogGateway } from '@/services/CatalogGateway'

export const supabaseCatalogGateway: CatalogGateway = {
  fetchProducts,
}
