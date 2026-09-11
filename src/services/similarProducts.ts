import { canonicalizeProductPair } from '@/lib/canonicalizeProductPair'
import type { ProductSimilarityVoteInsert } from '@/types'

export interface SimilarProduct {
  id: string
  name: string
  brand: string | null
  category: string
  base: string | null
  is_organic: boolean
  allergens: string[]
  avg_overall: number | null
  avg_taste: number | null
  avg_consistency: number | null
  avg_appearance: number | null
  avg_nutrition: number | null
  avg_value: number | null
  reviews_count: number
  storage_path: string | null
  agree_count: number
  total_count: number
  agreement_rate: number
  my_vote: boolean | null
}

export interface SimilarityCandidate {
  id: string
  name: string
  brand: string | null
  category: string
  storage_path: string | null
}

interface SimilarProductRow {
  agree_count: number
  agreement_rate: number
  allergens: string[] | null
  avg_appearance: number | null
  avg_consistency: number | null
  avg_nutrition: number | null
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

export interface SimilarProductsDependencies {
  deleteVote: (query: { product_id_a: string; product_id_b: string; user_id?: string }) => Promise<{
    error: unknown | null
  }>
  fetchSimilarProductsRpc: (productId: string) => Promise<{
    data: SimilarProductRow[] | null
    error: unknown | null
  }>
  searchSimilarityCandidatesRpc: (
    productId: string,
    search: string,
  ) => Promise<{
    data: SimilarityCandidate[] | null
    error: unknown | null
  }>
  upsertVote: (
    vote: ProductSimilarityVoteInsert,
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
    return (data ?? []).map((row) => ({
      ...row,
      allergens: row.allergens ?? [],
      avg_appearance: row.avg_appearance ?? null,
      avg_consistency: row.avg_consistency ?? null,
      avg_nutrition: row.avg_nutrition ?? null,
      avg_overall: row.avg_overall ?? null,
      avg_taste: row.avg_taste ?? null,
      avg_value: row.avg_value ?? null,
      base: row.base ?? null,
      brand: row.brand ?? null,
      my_vote: row.my_vote ?? null,
      storage_path: row.storage_path ?? null,
    }))
  }

  const searchSimilarityCandidates = async (
    productId: string,
    search: string,
  ): Promise<SimilarityCandidate[]> => {
    if (!search.trim()) return []

    const { data, error } = await dependencies.searchSimilarityCandidatesRpc(productId, search)
    if (error) throw error
    return (data ?? []).map((row) => ({
      ...row,
      brand: row.brand ?? null,
      storage_path: row.storage_path ?? null,
    }))
  }

  const voteSimilarity = async (
    productId: string,
    otherProductId: string,
    agreed: boolean,
    userId: string,
  ): Promise<void> => {
    ensureDifferentProducts(productId, otherProductId)
    const [productIdA, productIdB] = canonicalizeProductPair(productId, otherProductId)
    const vote: ProductSimilarityVoteInsert = {
      agreed,
      product_id_a: productIdA,
      product_id_b: productIdB,
      user_id: userId,
    }
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
          avg_nutrition: row.avg_nutrition,
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
    searchSimilarityCandidatesRpc: async (productId, search) => {
      const { data, error } = await supabase.rpc('search_similarity_candidates', {
        p_product_id: productId,
        p_search: search,
      })
      return {
        data: (data ?? []).map((row) => ({
          brand: row.brand,
          category: row.category,
          id: row.id,
          name: row.name,
          storage_path: row.storage_path,
        })),
        error,
      }
    },
    upsertVote: async (vote, options) =>
      supabase.from('product_similarity_vote').upsert(vote, options),
  })
  return defaultService
}

export const fetchSimilarProducts = async (productId: string): Promise<SimilarProduct[]> =>
  (await getDefaultService()).fetchSimilarProducts(productId)

export const searchSimilarityCandidates = async (
  productId: string,
  search: string,
): Promise<SimilarityCandidate[]> =>
  (await getDefaultService()).searchSimilarityCandidates(productId, search)

export const voteSimilarity = async (
  productId: string,
  otherProductId: string,
  agreed: boolean,
  userId: string,
): Promise<void> =>
  (await getDefaultService()).voteSimilarity(productId, otherProductId, agreed, userId)

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
