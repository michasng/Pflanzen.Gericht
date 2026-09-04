import { supabase } from '@/lib/supabase'
import type {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductImage,
  ProductIngredient,
} from '@/types'
import type { ProductListItem } from '@/services/catalog'

type IngredientWrite = {
  name: string
  fraction_basis_points: number | null
  comparator: string
}

const getIngredientSignature = (ingredient: {
  name: string
  comparator: string
  fractionBasisPoints: number | null
}): string =>
  `${ingredient.name}|${ingredient.comparator}|${ingredient.fractionBasisPoints === null ? '' : ingredient.fractionBasisPoints}`

const haveSameIngredientEntries = (
  existingIngredients: Pick<ProductIngredient, 'name' | 'fraction_basis_points' | 'comparator'>[],
  nextIngredients: IngredientWrite[],
): boolean => {
  if (existingIngredients.length !== nextIngredients.length) return false
  const existingSignatures = existingIngredients
    .map((ingredient) =>
      getIngredientSignature({
        name: ingredient.name,
        comparator: ingredient.comparator,
        fractionBasisPoints: ingredient.fraction_basis_points,
      }),
    )
    .sort()
  const nextSignatures = nextIngredients
    .map((ingredient) =>
      getIngredientSignature({
        name: ingredient.name,
        comparator: ingredient.comparator,
        fractionBasisPoints: ingredient.fraction_basis_points,
      }),
    )
    .sort()
  return existingSignatures.every((signature, index) => signature === nextSignatures[index])
}

export const fetchProduct = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase.from('product').select('*').eq('id', id).single()
  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return data
}

export const fetchProductImages = async (productId: string): Promise<ProductImage[]> => {
  const { data, error } = await supabase
    .from('product_image')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export const searchSimilarProducts = async (
  name: string,
): Promise<Pick<Product, 'id' | 'name' | 'brand' | 'category'>[]> => {
  if (!name.trim()) return []
  const { data, error } = await supabase
    .from('product')
    .select('id, name, brand, category')
    .ilike('normalized_name', `%${name.trim().toLowerCase()}%`)
    .limit(5)
  if (error) throw error
  return data ?? []
}

export const createProduct = async (
  fields: Pick<ProductInsert, 'name' | 'category' | 'base' | 'brand' | 'description'>,
  userId: string,
): Promise<Product> => {
  const { data, error } = await supabase
    .from('product')
    .insert({ ...fields, created_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateProduct = async (
  id: string,
  updates: Pick<ProductUpdate, 'name' | 'category' | 'base' | 'brand' | 'description'>,
): Promise<void> => {
  const { error } = await supabase.from('product').update(updates).eq('id', id)
  if (error) throw error
}

export const fetchProductIngredients = async (productId: string): Promise<ProductIngredient[]> => {
  const { data, error } = await supabase
    .from('product_ingredient')
    .select('*')
    .eq('product_id', productId)
  if (error) throw error
  return data ?? []
}

export const replaceProductIngredients = async (
  productId: string,
  ingredients: IngredientWrite[],
): Promise<void> => {
  const { data: existingIngredients, error: fetchError } = await supabase
    .from('product_ingredient')
    .select('name, fraction_basis_points, comparator')
    .eq('product_id', productId)
  if (fetchError) throw fetchError
  if (haveSameIngredientEntries(existingIngredients ?? [], ingredients)) return

  const { error: deleteError } = await supabase
    .from('product_ingredient')
    .delete()
    .eq('product_id', productId)
  if (deleteError) throw deleteError
  if (!ingredients.length) return
  const { error: insertError } = await supabase
    .from('product_ingredient')
    .insert(ingredients.map((ingredient) => ({ ...ingredient, product_id: productId })))
  if (insertError) throw insertError
}

export const fetchIngredientNameSuggestions = async (): Promise<string[]> => {
  const { data, error } = await supabase.from('product_ingredient').select('name').limit(500)
  if (error) throw error
  return [...new Set((data ?? []).map((row) => row.name))].sort()
}

export const uploadProductImage = async (
  productId: string,
  userId: string,
  file: File,
  sortOrder: number,
): Promise<ProductImage> => {
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

export const deleteProductImage = async (id: string, storagePath: string): Promise<void> => {
  const { error } = await supabase.from('product_image').delete().eq('id', id)
  if (error) throw error
  await supabase.storage.from('product-images').remove([storagePath])
}

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from('product').delete().eq('id', id)
  if (error) throw error
}

export const ADMIN_PAGE_SIZE = 50

export const fetchAllProductsForAdmin = async (page = 0): Promise<ProductListItem[]> => {
  const { data, error } = await supabase
    .from('product')
    .select('*, images:product_image(id, storage_path, sort_order)')
    .order('created_at', { ascending: false })
    .range(page * ADMIN_PAGE_SIZE, (page + 1) * ADMIN_PAGE_SIZE - 1)
  if (error) throw error
  return (data ?? []).map((p) => ({
    ...p,
    images: (p.images as ProductImage[] | null) ?? [],
  }))
}
