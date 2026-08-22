import { supabase } from '@/lib/supabase'
import type { PriceReport } from '@/types'

export type PriceReportWithProfile = PriceReport & {
  profile: { username: string; display_name: string | null }
}

export const fetchPriceReports = async (productId: string): Promise<PriceReportWithProfile[]> => {
  const { data, error } = await supabase
    .from('price_report')
    .select('*, profile:user_id(username, display_name)')
    .eq('product_id', productId)
    .order('observed_at', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    ...r,
    profile: r.profile as { username: string; display_name: string | null },
  }))
}

export const upsertPriceReport = async (
  productId: string,
  userId: string,
  store: string,
  cityName: string,
  priceEuroCents: number,
  salePriceEuroCents: number | null,
  observedAt: string,
): Promise<PriceReportWithProfile> => {
  const { data, error } = await supabase
    .from('price_report')
    .upsert(
      {
        product_id: productId,
        user_id: userId,
        store,
        city_name: cityName,
        price_euro_cents: priceEuroCents,
        sale_price_euro_cents: salePriceEuroCents,
        observed_at: observedAt,
      },
      { onConflict: 'product_id,user_id,store,city_name' },
    )
    .select('*, profile:user_id(username, display_name)')
    .single()
  if (error) throw error
  return {
    ...data,
    profile: data.profile as { username: string; display_name: string | null },
  }
}

export const deletePriceReport = async (id: string): Promise<void> => {
  const { error } = await supabase.from('price_report').delete().eq('id', id)
  if (error) throw error
}
