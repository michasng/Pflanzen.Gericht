import { DEFAULT_SORT_OPTION } from '@/config/sortOptions'
import { fetchProducts, type CatalogFilter, type ProductListItem } from '@/services/catalog'

const searchOnlyFilter = (search: string): CatalogFilter => ({
  search,
  category: null,
  base: null,
  sort: DEFAULT_SORT_OPTION,
  store: null,
  city: null,
  minPriceCents: null,
  maxPriceCents: null,
  minRating: null,
  tags: [],
  includeIngredients: [],
  excludeIngredients: [],
  excludeAllergens: [],
  organic: false,
})

export const fetchAdminProductsPage = async (
  page: number,
  search: string,
): Promise<ProductListItem[]> => {
  const { items } = await fetchProducts(searchOnlyFilter(search.trim()), page)
  return items
}
