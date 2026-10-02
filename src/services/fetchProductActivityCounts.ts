import { supabase } from '@/lib/supabase'

export interface ProductActivityCounts {
  reviewsCount: number
  priceReportsCount: number
  similarityVotesCount: number
}

interface CountResponse {
  count: number | null
  error: Error | null
}

const unwrapCount = async (query: PromiseLike<CountResponse>): Promise<number> => {
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

export const fetchProductActivityCounts = async (
  productId: string,
): Promise<ProductActivityCounts> => {
  const [reviewsCount, priceReportsCount, similarityVotesCount] = await Promise.all([
    unwrapCount(
      supabase
        .from('review')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId),
    ),
    unwrapCount(
      supabase
        .from('price_report')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId),
    ),
    unwrapCount(
      supabase
        .from('product_similarity_vote')
        .select('*', { count: 'exact', head: true })
        .or(`product_id_a.eq.${productId},product_id_b.eq.${productId}`),
    ),
  ])
  return { reviewsCount, priceReportsCount, similarityVotesCount }
}
