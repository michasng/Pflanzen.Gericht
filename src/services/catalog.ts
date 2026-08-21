import { supabase } from '@/lib/supabase'
import type { Product, ProductImage, Rating, RatingImage } from '@/types'

export type SortOption = 'newest' | 'top_rated' | 'most_rated' | 'price_asc' | 'price_desc'

export interface CatalogFilter {
  search: string
  category: string | null
  base: string | null
  sort: SortOption
}

export type ProductListItem = Product & { images: ProductImage[] }

export type RatingWithDetails = Rating & {
  profile: { username: string; display_name: string | null }
  tags: string[]
  images: RatingImage[]
}

export type ProductDetail = Product & {
  images: ProductImage[]
  ratings: RatingWithDetails[]
}

export const PAGE_SIZE = 20

export async function fetchProducts(filter: CatalogFilter, page = 0): Promise<ProductListItem[]> {
  let query = supabase
    .from('product')
    .select('*, images:product_image(id, storage_path, sort_order)')

  if (filter.search.trim()) {
    query = query.ilike('name', `%${filter.search.trim()}%`)
  }
  if (filter.category) {
    query = query.eq('category', filter.category)
  }
  if (filter.base) {
    query = query.eq('base', filter.base)
  }

  switch (filter.sort) {
    case 'top_rated':
      query = query.order('avg_overall', { ascending: false, nullsFirst: false })
      break
    case 'most_rated':
      query = query.order('ratings_count', { ascending: false })
      break
    case 'price_asc':
      query = query.order('avg_price', { ascending: true, nullsFirst: false })
      break
    case 'price_desc':
      query = query.order('avg_price', { ascending: false, nullsFirst: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  if (error) throw error

  return (data ?? []).map((p) => ({
    ...p,
    images: (p.images as ProductImage[] | null) ?? [],
  }))
}

export async function fetchProductDetail(id: string): Promise<ProductDetail | null> {
  const [{ data: p, error: pErr }, { data: rawRatings, error: rErr }] = await Promise.all([
    supabase
      .from('product')
      .select('*, images:product_image(id, storage_path, sort_order)')
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
  ])

  if (pErr?.code === 'PGRST116') return null
  if (pErr) throw pErr
  if (rErr) throw rErr
  if (!p) return null

  return {
    ...p,
    images: (p.images as ProductImage[] | null) ?? [],
    ratings: (rawRatings ?? []).map((r) => ({
      ...r,
      profile: r.profile as { username: string; display_name: string | null },
      tags: ((r.tags ?? []) as { tag: string }[]).map((t) => t.tag),
      images: (r.images as RatingImage[] | null) ?? [],
    })),
  }
}

export function getImageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
