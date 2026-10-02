import { supabase } from '@/lib/supabase'
import { camelizeKeys } from '@/lib/camelizeKeys'
import type { ProductSimilarityVote } from '@/types'

export const fetchProductSimilarityVotes = async (
  productId: string,
): Promise<ProductSimilarityVote[]> => {
  const { data, error } = await supabase
    .from('product_similarity_vote')
    .select('*')
    .or(`product_id_a.eq.${productId},product_id_b.eq.${productId}`)
  if (error) throw error
  return camelizeKeys(data ?? [])
}
