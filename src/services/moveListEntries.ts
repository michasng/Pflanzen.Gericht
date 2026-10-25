import { supabase } from '@/lib/supabase'

export const moveListEntries = async (
  duplicateProductIds: string[],
  mergedProductId: string,
): Promise<void> => {
  const { error } = await supabase.rpc('move_list_entries', {
    duplicate_product_ids: duplicateProductIds,
    merged_product_id: mergedProductId,
  })
  if (error) throw error
}
