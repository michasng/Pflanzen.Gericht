import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../../src/types/database.js'

type ProductRow = Database['public']['Tables']['product']['Row']

export interface ExistingProductSummary extends ProductRow {
  sourceUrls: string[]
}

export const loadExistingProductMatches = async (
  supabase: SupabaseClient<Database>,
  sourceUrl: string,
): Promise<ExistingProductSummary[]> => {
  const { data, error } = await supabase
    .from('product_source')
    .select('product(*, product_source(url))')
    .eq('url', sourceUrl)
  if (error) throw error
  return data.map(({ product: { product_source, ...product } }) => ({
    ...product,
    sourceUrls: product_source.map((source) => source.url),
  }))
}
