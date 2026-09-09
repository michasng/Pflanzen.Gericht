import { canonicalizeProductPair } from '@/lib/canonicalizeProductPair'
import { supabase } from '@/lib/supabase'
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
  ratings_count: number
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

const ensureDifferentProducts = (productId: string, otherProductId: string): void => {
  if (productId === otherProductId) {
    throw new Error('Ein Produkt kann nicht mit sich selbst verknüpft werden.')
  }
}

export const fetchSimilarProducts = async (productId: string): Promise<SimilarProduct[]> => {
  const { data, error } = await supabase.rpc('fetch_similar_products', {
    p_product_id: productId,
  })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    allergens: row.allergens ?? [],
    avg_overall: row.avg_overall ?? null,
    base: row.base ?? null,
    brand: row.brand ?? null,
    my_vote: row.my_vote ?? null,
    storage_path: row.storage_path ?? null,
  }))
}

export const searchSimilarityCandidates = async (
  productId: string,
  search: string,
): Promise<SimilarityCandidate[]> => {
  if (!search.trim()) return []

  const { data, error } = await supabase.rpc('search_similarity_candidates', {
    p_product_id: productId,
    p_search: search,
  })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    brand: row.brand ?? null,
    storage_path: row.storage_path ?? null,
  }))
}

export const voteSimilarity = async (
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
  const { error } = await supabase
    .from('product_similarity_vote')
    .upsert(vote, { onConflict: 'product_id_a,product_id_b,user_id' })
  if (error) throw error
}

export const removeSimilarityVote = async (
  productId: string,
  otherProductId: string,
  userId: string,
): Promise<void> => {
  ensureDifferentProducts(productId, otherProductId)
  const [productIdA, productIdB] = canonicalizeProductPair(productId, otherProductId)
  const { error } = await supabase
    .from('product_similarity_vote')
    .delete()
    .match({ product_id_a: productIdA, product_id_b: productIdB, user_id: userId })
  if (error) throw error
}

export const adminRemoveSimilarity = async (
  productId: string,
  otherProductId: string,
): Promise<void> => {
  ensureDifferentProducts(productId, otherProductId)
  const [productIdA, productIdB] = canonicalizeProductPair(productId, otherProductId)
  const { error } = await supabase
    .from('product_similarity_vote')
    .delete()
    .match({ product_id_a: productIdA, product_id_b: productIdB })
  if (error) throw error
}
