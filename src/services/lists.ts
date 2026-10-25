import { supabase } from '@/lib/supabase'
import { DATABASE_LIST_VISIBILITY } from '@/config/databaseListVisibility'
import { ListVisibility } from '@/config/ListVisibility'
import { camelizeKeys } from '@/lib/camelizeKeys'
import { toListSummary } from '@/lib/toListSummary'
import { toListWriteError } from '@/lib/toListWriteError'
import { toPageRange } from '@/lib/toPageRange'
import type { ListProduct } from '@/lib/ListProduct'
import type { ListSummary } from '@/lib/ListSummary'
import type { PageRequest } from '@/lib/PageRequest'
import type { ListInput } from '@/services/ListGateway'
import type { UserListsPageRequest } from '@/services/profile'

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
  request: UserListsPageRequest,
): Promise<ListSummary[]> => {
  let query = supabase.from('list_summary').select('*').eq('owner_id', ownerId)
  if (request.onlyPublic) {
    query = query.eq('visibility', DATABASE_LIST_VISIBILITY[ListVisibility.Public])
  }
  const { data, error } = await query
    .order('sort_name')
    .order('id')
    .range(...toPageRange(request))
  if (error) throw error
  return camelizeKeys(data ?? []).map(toListSummary)
}

export const fetchListProducts = async (
  listId: string,
  request: PageRequest,
): Promise<ListProduct[]> => {
  const { data, error } = await supabase
    .from('list_entry')
    .select('added_at, product:product_id(*, images:product_image(storage_path, sort_order))')
    .eq('list_id', listId)
    .order('added_at', { ascending: false })
    .order('product_id')
    .range(...toPageRange(request))
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
  if (onlyPublic) {
    query = query.eq('visibility', DATABASE_LIST_VISIBILITY[ListVisibility.Public])
  }
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

export const createList = async (ownerId: string, input: ListInput): Promise<string> => {
  const { data, error } = await supabase
    .from('list')
    .insert({
      owner_id: ownerId,
      name: input.name,
      visibility: DATABASE_LIST_VISIBILITY[input.visibility],
    })
    .select('id')
    .single()
  if (error) throw toListWriteError(error)
  return data.id
}

export const fetchAllUserLists = async (ownerId: string): Promise<ListSummary[]> => {
  const { data, error } = await supabase
    .from('list_summary')
    .select('*')
    .eq('owner_id', ownerId)
    .order('sort_name')
    .order('id')
  if (error) throw error
  return camelizeKeys(data ?? []).map(toListSummary)
}

export const fetchListIdsByProductId = async (
  ownerId: string,
  productIds: string[],
): Promise<Record<string, string[]>> => {
  const listIdsByProductId: Record<string, string[]> = Object.fromEntries(
    productIds.map((productId) => [productId, []]),
  )
  if (productIds.length === 0) return listIdsByProductId
  const { data, error } = await supabase
    .from('list_entry')
    .select('list_id, product_id, list:list_id!inner(owner_id)')
    .in('product_id', productIds)
    .eq('list.owner_id', ownerId)
  if (error) throw error
  for (const entry of data ?? []) listIdsByProductId[entry.product_id]?.push(entry.list_id)
  return listIdsByProductId
}

export const updateList = async (listId: string, input: ListInput): Promise<void> => {
  const { error } = await supabase
    .from('list')
    .update({ name: input.name, visibility: DATABASE_LIST_VISIBILITY[input.visibility] })
    .eq('id', listId)
  if (error) throw toListWriteError(error)
}

export const deleteList = async (listId: string): Promise<void> => {
  const { error } = await supabase.from('list').delete().eq('id', listId)
  if (error) throw error
}
