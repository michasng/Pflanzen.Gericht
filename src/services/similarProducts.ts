import { canonicalizeProductPair } from '@/lib/canonicalizeProductPair'
import { camelizeKeys } from '@/lib/camelizeKeys'
import { snakeifyKeys } from '@/lib/snakeifyKeys'
import type { ProductSimilarityVoteInsert } from '@/types'
import type { TablesInsert } from '@/types/database'

export interface SimilarProduct {
  id: string
  name: string
  brand: string | null
  category: string
  base: string | null
  isOrganic: boolean
  allergens: string[]
  avgOverall: number | null
  avgTaste: number | null
  avgConsistency: number | null
  avgAppearance: number | null
  avgValue: number | null
  reviewsCount: number
  storagePath: string | null
  agreeCount: number
  totalCount: number
  agreementRate: number
  myVote: boolean | null
}

export interface SimilarityCandidate {
  id: string
  name: string
  brand: string | null
  category: string
  storagePath: string | null
}

export interface SimilarityCandidateSource {
  id: string
  category: string
}

export interface CandidateProductRow {
  id: string
  name: string
  brand: string | null
  category: string
}

export interface CandidateImageRow {
  product_id: string
  storage_path: string
}

export const MAX_SIMILARITY_CANDIDATES = 8

interface SimilarProductRow {
  agree_count: number
  agreement_rate: number
  allergens: string[] | null
  avg_appearance: number | null
  avg_consistency: number | null
  avg_overall: number | null
  avg_taste: number | null
  avg_value: number | null
  base: string | null
  brand: string | null
  category: string
  id: string
  is_organic: boolean
  my_vote: boolean | null
  name: string
  reviews_count: number
  storage_path: string | null
  total_count: number
}

export type SimilarityVoteHistory = Pick<ProductSimilarityVoteInsert, 'createdAt' | 'updatedAt'>

export interface SimilarProductsDependencies {
  deleteVote: (query: { product_id_a: string; product_id_b: string; user_id?: string }) => Promise<{
    error: unknown | null
  }>
  fetchSimilarProductsRpc: (productId: string) => Promise<{
    data: SimilarProductRow[] | null
    error: unknown | null
  }>
  searchProductsRpc: (query: { search: string; category: string; limit: number }) => Promise<{
    data: CandidateProductRow[] | null
    error: unknown | null
  }>
  /** Images must be ordered by their display order, so the first one per product is its cover */
  fetchProductImages: (productIds: string[]) => Promise<{
    data: CandidateImageRow[] | null
    error: unknown | null
  }>
  upsertVote: (
    vote: TablesInsert<'product_similarity_vote'>,
    options: { onConflict: string },
  ) => Promise<{ error: unknown | null }>
}

const ensureDifferentProducts = (productId: string, otherProductId: string): void => {
  if (productId === otherProductId) {
    throw new Error('Ein Produkt kann nicht mit sich selbst verknüpft werden.')
  }
}

export const createSimilarProductsService = (dependencies: SimilarProductsDependencies) => {
  const fetchSimilarProducts = async (productId: string): Promise<SimilarProduct[]> => {
    const { data, error } = await dependencies.fetchSimilarProductsRpc(productId)
    if (error) throw error
    return camelizeKeys(
      (data ?? []).map((row) => ({
        ...row,
        allergens: row.allergens ?? [],
        avg_appearance: row.avg_appearance ?? null,
        avg_consistency: row.avg_consistency ?? null,
        avg_overall: row.avg_overall ?? null,
        avg_taste: row.avg_taste ?? null,
        avg_value: row.avg_value ?? null,
        base: row.base ?? null,
        brand: row.brand ?? null,
        my_vote: row.my_vote ?? null,
        storage_path: row.storage_path ?? null,
      })),
    )
  }

  const fetchCoverStoragePaths = async (productIds: string[]): Promise<Map<string, string>> => {
    const { data, error } = await dependencies.fetchProductImages(productIds)
    if (error) throw error
    const coverStoragePathByProductId = new Map<string, string>()
    for (const image of data ?? []) {
      if (coverStoragePathByProductId.has(image.product_id)) continue
      coverStoragePathByProductId.set(image.product_id, image.storage_path)
    }
    return coverStoragePathByProductId
  }

  const searchSimilarityCandidates = async (
    product: SimilarityCandidateSource,
    search: string,
  ): Promise<SimilarityCandidate[]> => {
    if (!search.trim()) return []

    const { data, error } = await dependencies.searchProductsRpc({
      search,
      category: product.category,
      // One extra, because the product itself may be among the results
      limit: MAX_SIMILARITY_CANDIDATES + 1,
    })
    if (error) throw error

    const candidates = (data ?? [])
      .filter((row) => row.id !== product.id)
      .slice(0, MAX_SIMILARITY_CANDIDATES)
    if (candidates.length === 0) return []

    const coverStoragePathByProductId = await fetchCoverStoragePaths(
      candidates.map((candidate) => candidate.id),
    )
    return candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      brand: candidate.brand ?? null,
      category: candidate.category,
      storagePath: coverStoragePathByProductId.get(candidate.id) ?? null,
    }))
  }

  const voteSimilarity = async (
    productId: string,
    otherProductId: string,
    agreed: boolean,
    userId: string,
    history?: SimilarityVoteHistory,
  ): Promise<void> => {
    ensureDifferentProducts(productId, otherProductId)
    const [productIdA, productIdB] = canonicalizeProductPair(productId, otherProductId)
    const vote: TablesInsert<'product_similarity_vote'> = snakeifyKeys({
      ...history,
      agreed,
      productIdA,
      productIdB,
      userId,
    })
    const { error } = await dependencies.upsertVote(vote, {
      onConflict: 'product_id_a,product_id_b,user_id',
    })
    if (error) throw error
  }

  const removeSimilarityVote = async (
    productId: string,
    otherProductId: string,
    userId: string,
  ): Promise<void> => {
    ensureDifferentProducts(productId, otherProductId)
    const [productIdA, productIdB] = canonicalizeProductPair(productId, otherProductId)
    const { error } = await dependencies.deleteVote({
      product_id_a: productIdA,
      product_id_b: productIdB,
      user_id: userId,
    })
    if (error) throw error
  }

  const adminRemoveSimilarity = async (
    productId: string,
    otherProductId: string,
  ): Promise<void> => {
    ensureDifferentProducts(productId, otherProductId)
    const [productIdA, productIdB] = canonicalizeProductPair(productId, otherProductId)
    const { error } = await dependencies.deleteVote({
      product_id_a: productIdA,
      product_id_b: productIdB,
    })
    if (error) throw error
  }

  return {
    adminRemoveSimilarity,
    fetchSimilarProducts,
    removeSimilarityVote,
    searchSimilarityCandidates,
    voteSimilarity,
  }
}

let defaultService: ReturnType<typeof createSimilarProductsService> | null = null

const getDefaultService = async (): Promise<ReturnType<typeof createSimilarProductsService>> => {
  if (defaultService) return defaultService
  const { supabase } = await import('@/lib/supabase')
  defaultService = createSimilarProductsService({
    deleteVote: async (query) => supabase.from('product_similarity_vote').delete().match(query),
    fetchSimilarProductsRpc: async (productId) => {
      const { data, error } = await supabase.rpc('fetch_similar_products', {
        p_product_id: productId,
      })
      return {
        data: (data ?? []).map((row) => ({
          agree_count: row.agree_count,
          agreement_rate: row.agreement_rate,
          allergens: row.allergens,
          avg_appearance: row.avg_appearance,
          avg_consistency: row.avg_consistency,
          avg_overall: row.avg_overall,
          avg_taste: row.avg_taste,
          avg_value: row.avg_value,
          base: row.base,
          brand: row.brand,
          category: row.category,
          id: row.id,
          is_organic: row.is_organic,
          my_vote: row.my_vote,
          name: row.name,
          reviews_count: row.reviews_count,
          storage_path: row.storage_path,
          total_count: row.total_count,
        })),
        error,
      }
    },
    searchProductsRpc: async ({ search, category, limit }) => {
      const { data, error } = await supabase.rpc('search_products', {
        p_search: search,
        p_category: category,
        p_limit: limit,
      })
      return {
        data: (data ?? []).map((row) => ({
          brand: row.brand,
          category: row.category,
          id: row.id,
          name: row.name,
        })),
        error,
      }
    },
    fetchProductImages: async (productIds) =>
      supabase
        .from('product_image')
        .select('product_id, storage_path')
        .in('product_id', productIds)
        .order('sort_order')
        .order('created_at')
        .order('id'),
    upsertVote: async (vote, options) =>
      supabase.from('product_similarity_vote').upsert(vote, options),
  })
  return defaultService
}

export const fetchSimilarProducts = async (productId: string): Promise<SimilarProduct[]> =>
  (await getDefaultService()).fetchSimilarProducts(productId)

export const searchSimilarityCandidates = async (
  product: SimilarityCandidateSource,
  search: string,
): Promise<SimilarityCandidate[]> =>
  (await getDefaultService()).searchSimilarityCandidates(product, search)

export const voteSimilarity = async (
  productId: string,
  otherProductId: string,
  agreed: boolean,
  userId: string,
  history?: SimilarityVoteHistory,
): Promise<void> =>
  (await getDefaultService()).voteSimilarity(productId, otherProductId, agreed, userId, history)

export const removeSimilarityVote = async (
  productId: string,
  otherProductId: string,
  userId: string,
): Promise<void> =>
  (await getDefaultService()).removeSimilarityVote(productId, otherProductId, userId)

export const adminRemoveSimilarity = async (
  productId: string,
  otherProductId: string,
): Promise<void> => (await getDefaultService()).adminRemoveSimilarity(productId, otherProductId)
