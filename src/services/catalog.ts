import { supabase } from '@/lib/supabase'
import type {
  Product,
  ProductImage,
  ProductIngredient,
  ProductNutrient,
  Rating,
  RatingImage,
} from '@/types'
import { fetchPriceReports, type PriceReportWithProfile } from '@/services/prices'
import type { SortOption } from '@/config/sortOptions'

export type { SortOption }

export interface CatalogFilter {
  search: string
  category: string | null
  base: string | null
  sort: SortOption
  store: string | null
  city: string | null
  minPriceCents: number | null
  maxPriceCents: number | null
  minRating: number | null
  tags: string[]
  includeIngredients: string[]
  excludeIngredients: string[]
}

export type ProductListItem = Product & { images: ProductImage[] }

export interface ProductPage {
  items: ProductListItem[]
  total: number
}

export type RatingWithDetails = Rating & {
  profile: { username: string; display_name: string | null }
  tags: string[]
  images: RatingImage[]
}

export type ProductDetail = Product & {
  images: ProductImage[]
  ingredients: ProductIngredient[]
  nutrients: ProductNutrient[]
  ratings: RatingWithDetails[]
  priceReports: PriceReportWithProfile[]
}

export const PAGE_SIZE = 20

export const fetchProducts = async (filter: CatalogFilter, page = 0): Promise<ProductPage> => {
  const { data, error } = await supabase.rpc('search_products', {
    p_search: filter.search || undefined,
    p_category: filter.category ?? undefined,
    p_base: filter.base ?? undefined,
    p_min_rating: filter.minRating ?? undefined,
    p_store: filter.store ?? undefined,
    p_city: filter.city ?? undefined,
    p_min_price: filter.minPriceCents ?? undefined,
    p_max_price: filter.maxPriceCents ?? undefined,
    p_tags: filter.tags.length ? filter.tags : undefined,
    p_sort: filter.sort,
    p_limit: PAGE_SIZE,
    p_offset: page * PAGE_SIZE,
    p_include_ingredients: filter.includeIngredients.length ? filter.includeIngredients : undefined,
    p_exclude_ingredients: filter.excludeIngredients.length ? filter.excludeIngredients : undefined,
  })
  if (error) throw error

  const rows = data ?? []
  const total = rows[0]?.total_count ?? 0

  const ids = rows.map((r) => r.id)
  const images =
    ids.length > 0
      ? await supabase
          .from('product_image')
          .select('id, product_id, storage_path, sort_order, created_at')
          .in('product_id', ids)
          .then(({ data: imgs, error: imgErr }) => {
            if (imgErr) throw imgErr
            return imgs ?? []
          })
      : []

  const imagesByProduct = new Map<string, ProductImage[]>()
  for (const img of images) {
    const list = imagesByProduct.get(img.product_id) ?? []
    list.push(img as ProductImage)
    imagesByProduct.set(img.product_id, list)
  }

  return {
    items: rows.map((r) => ({
      ...r,
      avg_overall: r.avg_overall ?? null,
      brand: r.brand ?? null,
      base: r.base ?? null,
      description: r.description ?? null,
      energy_joules: r.energy_joules ?? null,
      min_price_euro_cents: r.min_price_euro_cents ?? null,
      normalized_name: r.normalized_name ?? null,
      images: imagesByProduct.get(r.id) ?? [],
    })),
    total,
  }
}

export const fetchProductDetail = async (id: string): Promise<ProductDetail | null> => {
  const [{ data: p, error: pErr }, { data: rawRatings, error: rErr }, priceReports] =
    await Promise.all([
      supabase
        .from('product')
        .select(
          '*, images:product_image(id, storage_path, sort_order), ingredients:product_ingredient(id, name, fraction_basis_points, comparator), nutrients:product_nutrient(id, name, amount_micrograms)',
        )
        .eq('id', id)
        .single(),
      supabase
        .from('rating')
        .select(
          '*, profile:user_id(username, display_name), tags:rating_tag(tag), images:rating_image(id, storage_path, sort_order)',
        )
        .eq('product_id', id)
        .order('is_current', { ascending: false })
        .order('created_at', { ascending: false }),
      fetchPriceReports(id),
    ])

  if (pErr?.code === 'PGRST116') return null
  if (pErr) throw pErr
  if (rErr) throw rErr
  if (!p) return null

  return {
    ...p,
    images: (p.images as ProductImage[] | null) ?? [],
    ingredients: (p.ingredients as ProductIngredient[] | null) ?? [],
    nutrients: (p.nutrients as ProductNutrient[] | null) ?? [],
    ratings: (rawRatings ?? []).map((r) => ({
      ...r,
      profile: r.profile as { username: string; display_name: string | null },
      tags: ((r.tags ?? []) as { tag: string }[]).map((t) => t.tag),
      images: (r.images as RatingImage[] | null) ?? [],
    })),
    priceReports,
  }
}

export const getImageUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
