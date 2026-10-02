import { supabase } from '@/lib/supabase'
import { camelizeKeys } from '@/lib/camelizeKeys'
import { snakeifyKeys } from '@/lib/snakeifyKeys'
import type { PriceReport } from '@/types'

export type PriceReportWithProfile = PriceReport & {
  profile: { username: string; displayName: string | null }
}

interface ProfileRow {
  username: string
  display_name: string | null
}

export const fetchPriceReports = async (productId: string): Promise<PriceReportWithProfile[]> => {
  const { data, error } = await supabase
    .from('price_report')
    .select('*, profile:user_id(username, display_name)')
    .eq('product_id', productId)
    .order('observed_at', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return camelizeKeys((data ?? []).map((r) => ({ ...r, profile: r.profile as ProfileRow })))
}

export const upsertPriceReport = async (
  productId: string,
  userId: string,
  store: string,
  cityName: string,
  priceEuroCents: number,
  salePriceEuroCents: number | null,
  observedAt: string,
  createdAt?: string,
): Promise<PriceReportWithProfile> => {
  const { data, error } = await supabase
    .from('price_report')
    .upsert(
      snakeifyKeys({
        productId,
        userId,
        store,
        cityName,
        priceEuroCents,
        salePriceEuroCents,
        observedAt,
        createdAt,
      }),
      { onConflict: 'product_id,user_id,store,city_name' },
    )
    .select('*, profile:user_id(username, display_name)')
    .single()
  if (error) throw error
  return camelizeKeys({ ...data, profile: data.profile as ProfileRow })
}

export const fetchPriceReportCityNames = async (store: string): Promise<string[]> => {
  const { data } = await supabase
    .from('price_report')
    .select('city_name')
    .eq('store', store)
    .neq('city_name', '')
  return [...new Set((data ?? []).map((row) => row.city_name))].sort()
}

export const deletePriceReport = async (id: string): Promise<void> => {
  const { error } = await supabase.from('price_report').delete().eq('id', id)
  if (error) throw error
}
