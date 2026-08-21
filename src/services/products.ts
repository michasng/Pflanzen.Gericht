import { supabase } from '@/lib/supabase'
import type { Product, ProductInsert, ProductUpdate, ProductImage } from '@/types'

export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('product').select('*').eq('id', id).single()
  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return data
}

export async function fetchProductImages(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_image')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function searchSimilarProducts(
  name: string,
): Promise<Pick<Product, 'id' | 'name' | 'brand' | 'category'>[]> {
  if (!name.trim()) return []
  const { data, error } = await supabase
    .from('product')
    .select('id, name, brand, category')
    .ilike('normalized_name', `%${name.trim().toLowerCase()}%`)
    .limit(5)
  if (error) throw error
  return data ?? []
}

export async function createProduct(
  fields: Pick<ProductInsert, 'name' | 'category' | 'base' | 'brand' | 'description'>,
  userId: string,
): Promise<Product> {
  const { data, error } = await supabase
    .from('product')
    .insert({ ...fields, created_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProduct(
  id: string,
  updates: Pick<ProductUpdate, 'name' | 'category' | 'base' | 'brand' | 'description'>,
): Promise<void> {
  const { error } = await supabase.from('product').update(updates).eq('id', id)
  if (error) throw error
}

export async function uploadProductImage(
  productId: string,
  userId: string,
  file: File,
  sortOrder: number,
): Promise<ProductImage> {
  const path = `${userId}/${productId}/${crypto.randomUUID()}.webp`
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: 'image/webp' })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('product_image')
    .insert({ product_id: productId, storage_path: path, sort_order: sortOrder })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProductImage(id: string, storagePath: string): Promise<void> {
  const { error } = await supabase.from('product_image').delete().eq('id', id)
  if (error) throw error
  await supabase.storage.from('product-images').remove([storagePath])
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('product').delete().eq('id', id)
  if (error) throw error
}
