import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../../src/types/database.js'

type ProductRow = Database['public']['Tables']['product']['Row']

export interface ExistingProductSummary extends ProductRow {
  sourceUrls: string[]
}

export const loadExistingProducts = async (
  supabase: SupabaseClient<Database>,
): Promise<ExistingProductSummary[]> => {
  const { data, error } = await supabase.from('product').select('*, product_source(url)')
  if (error) throw error
  return data.map(({ product_source, ...product }) => ({
    ...product,
    sourceUrls: product_source.map((source) => source.url),
  }))
}
