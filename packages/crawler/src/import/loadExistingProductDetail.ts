import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../../src/types/database.js'

export interface ExistingProductDetail {
  ingredients: Database['public']['Tables']['product_ingredient']['Row'][]
  nutrients: Database['public']['Tables']['product_nutrient']['Row'][]
}

export const loadExistingProductDetail = async (
  supabase: SupabaseClient<Database>,
  productId: string,
): Promise<ExistingProductDetail> => {
  const [ingredientsResult, nutrientsResult] = await Promise.all([
    supabase
      .from('product_ingredient')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order')
      .order('created_at')
      .order('id'),
    supabase.from('product_nutrient').select('*').eq('product_id', productId),
  ])
  if (ingredientsResult.error) throw ingredientsResult.error
  if (nutrientsResult.error) throw nutrientsResult.error
  return { ingredients: ingredientsResult.data ?? [], nutrients: nutrientsResult.data ?? [] }
}
