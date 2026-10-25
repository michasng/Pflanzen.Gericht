import { supabase } from '@/lib/supabase'
import { ListVisibility } from '@/config/ListVisibility'
import { camelizeKeys } from '@/lib/camelizeKeys'
import { toListSummary } from '@/lib/toListSummary'
import { toListWriteError } from '@/lib/toListWriteError'
import type { ListProduct } from '@/lib/ListProduct'
import type { ListSummary } from '@/lib/ListSummary'
import type { ListInput } from '@/services/ListGateway'
import type { UserListsPageRequest, UserPageRequest } from '@/services/profile'
import type { TablesInsert } from '@/types/database'

const DATABASE_VISIBILITY: Record<ListVisibility, TablesInsert<'list'>['visibility']> = {
  [ListVisibility.Public]: 'public',
  [ListVisibility.Private]: 'private',
}

export const fetchList = async (listId: string): Promise<ListSummary | null> => {
  const { data, error } = await supabase
    .from('list_summary')
    .select('*')
    .eq('id', listId)
    .maybeSingle()
  if (error) throw error
  return data ? toListSummary(camelizeKeys(data)) : null
}

export const fetchUserLists = async (
  ownerId: string,
  { page, pageSize, onlyPublic }: UserListsPageRequest,
): Promise<ListSummary[]> => {
  let query = supabase.from('list_summary').select('*').eq('owner_id', ownerId)
  if (onlyPublic) query = query.eq('visibility', DATABASE_VISIBILITY[ListVisibility.Public])
  const { data, error } = await query
    .order('sort_name')
    .order('id')
    .range(page * pageSize, (page + 1) * pageSize - 1)
  if (error) throw error
  return camelizeKeys(data ?? []).map(toListSummary)
}

export const fetchListProducts = async (
  listId: string,
  { page, pageSize }: UserPageRequest,
): Promise<ListProduct[]> => {
  const { data, error } = await supabase
    .from('list_entry')
    .select('added_at, product:product_id(*, images:product_image(storage_path, sort_order))')
    .eq('list_id', listId)
    .order('added_at', { ascending: false })
    .order('product_id')
    .range(page * pageSize, (page + 1) * pageSize - 1)
  if (error) throw error
  return (data ?? []).map(({ added_at, product }) => ({
    ...camelizeKeys(product),
    addedAt: added_at,
  }))
}

export const fetchProductIdsOnList = async (
  listId: string,
  productIds: string[],
): Promise<string[]> => {
  if (productIds.length === 0) return []
  const { data, error } = await supabase
    .from('list_entry')
    .select('product_id')
    .eq('list_id', listId)
    .in('product_id', productIds)
  if (error) throw error
  return (data ?? []).map((entry) => entry.product_id)
}

export const addProductToList = async (listId: string, productId: string): Promise<void> => {
  const { error } = await supabase
    .from('list_entry')
    .upsert({ list_id: listId, product_id: productId }, { ignoreDuplicates: true })
  if (error) throw error
}

export const removeProductFromList = async (listId: string, productId: string): Promise<void> => {
  const { error } = await supabase
    .from('list_entry')
    .delete()
    .eq('list_id', listId)
    .eq('product_id', productId)
  if (error) throw error
}

export const countUserLists = async (ownerId: string, onlyPublic: boolean): Promise<number> => {
  let query = supabase
    .from('list')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
  if (onlyPublic) query = query.eq('visibility', DATABASE_VISIBILITY[ListVisibility.Public])
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

export const createList = async (ownerId: string, input: ListInput): Promise<void> => {
  const { error } = await supabase.from('list').insert({
    owner_id: ownerId,
    name: input.name,
    visibility: DATABASE_VISIBILITY[input.visibility],
  })
  if (error) throw toListWriteError(error)
}

export const updateList = async (listId: string, input: ListInput): Promise<void> => {
  const { error } = await supabase
    .from('list')
    .update({ name: input.name, visibility: DATABASE_VISIBILITY[input.visibility] })
    .eq('id', listId)
  if (error) throw toListWriteError(error)
}

export const deleteList = async (listId: string): Promise<void> => {
  const { error } = await supabase.from('list').delete().eq('id', listId)
  if (error) throw error
}
