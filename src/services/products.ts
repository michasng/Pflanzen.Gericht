import { supabase } from '@/lib/supabase'
import { generateSquareImageVariants } from '@/lib/generateSquareImageVariants'
import { deleteImageVariants, persistImageVariants } from '@/lib/imageVariantStorage'
import type {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductImage,
  ProductIngredient,
  ProductNutrient,
} from '@/types'
import type { ProductListItem } from '@/services/catalog'

const PRODUCT_IMAGE_BUCKET = 'product-images'
const REVIEW_IMAGE_BUCKET = 'review-images'
const DELETE_PRODUCT_PAGE_SIZE = 1000
const PENDING_PRODUCT_DELETION_PRIMARY_KEY = 'pending_product_deletion_pkey'

type IngredientWrite = {
  name: string
  fraction_basis_points: number | null
  comparator: string
}

type NutrientWrite = {
  name: string
  amount_micrograms: number
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

const getNutrientSignature = (nutrient: NutrientWrite): string =>
  `${nutrient.name}|${nutrient.amount_micrograms}`

const haveSameNutrientEntries = (
  existingNutrients: Pick<ProductNutrient, 'name' | 'amount_micrograms'>[],
  nextNutrients: NutrientWrite[],
): boolean => {
  if (existingNutrients.length !== nextNutrients.length) return false
  const existingSignatures = existingNutrients.map(getNutrientSignature).sort()
  const nextSignatures = nextNutrients.map(getNutrientSignature).sort()
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
  fields: Pick<
    ProductInsert,
    | 'name'
    | 'category'
    | 'base'
    | 'brand'
    | 'description'
    | 'energy_joules'
    | 'allergens'
    | 'is_organic'
    | 'barcode'
  >,
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
  updates: Pick<
    ProductUpdate,
    | 'name'
    | 'category'
    | 'base'
    | 'brand'
    | 'description'
    | 'energy_joules'
    | 'allergens'
    | 'is_organic'
    | 'barcode'
  >,
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

export const fetchProductNutrients = async (productId: string): Promise<ProductNutrient[]> => {
  const { data, error } = await supabase
    .from('product_nutrient')
    .select('*')
    .eq('product_id', productId)
  if (error) throw error
  return data ?? []
}

export const replaceProductNutrients = async (
  productId: string,
  nutrients: NutrientWrite[],
): Promise<void> => {
  const { data: existingNutrients, error: fetchError } = await supabase
    .from('product_nutrient')
    .select('name, amount_micrograms')
    .eq('product_id', productId)
  if (fetchError) throw fetchError
  if (haveSameNutrientEntries(existingNutrients ?? [], nutrients)) return

  const { error: deleteError } = await supabase
    .from('product_nutrient')
    .delete()
    .eq('product_id', productId)
  if (deleteError) throw deleteError
  if (!nutrients.length) return
  const { error: insertError } = await supabase
    .from('product_nutrient')
    .insert(nutrients.map((nutrient) => ({ ...nutrient, product_id: productId })))
  if (insertError) throw insertError
}

export const fetchNutrientNameSuggestions = async (): Promise<string[]> => {
  const { data, error } = await supabase.from('product_nutrient').select('name').limit(500)
  if (error) throw error
  return [...new Set((data ?? []).map((row) => row.name))].sort()
}

export const uploadProductImage = async (
  productId: string,
  userId: string,
  file: File,
  sortOrder: number,
): Promise<ProductImage> => {
  const bucket = supabase.storage.from('product-images')
  const storagePath = `${userId}/${productId}/${crypto.randomUUID()}`
  const variants = await generateSquareImageVariants(file)
  return persistImageVariants(
    {
      removeVariants: async (paths) => {
        const { error } = await bucket.remove(paths)
        if (error) throw error
      },
      uploadVariant: async (path, variantFile) => {
        const { error } = await bucket.upload(path, variantFile, { contentType: 'image/webp' })
        return { error }
      },
    },
    storagePath,
    variants,
    async () => {
      const { data, error } = await supabase
        .from('product_image')
        .insert({ product_id: productId, storage_path: storagePath, sort_order: sortOrder })
        .select()
        .single()
      if (error) throw error
      return data
    },
  )
}

export const deleteProductImage = async (id: string, storagePath: string): Promise<void> => {
  const { error } = await supabase.from('product_image').delete().eq('id', id)
  if (error) throw error
  await deleteImageVariants(
    {
      removeVariants: async (paths) => {
        const { error: removeError } = await supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .remove(paths)
        if (removeError) throw removeError
      },
    },
    [storagePath],
  )
}

const fetchAllPagedRows = async <TRow>(
  fetchPage: (from: number, to: number) => Promise<TRow[]>,
): Promise<TRow[]> => {
  const rows: TRow[] = []

  for (let pageIndex = 0; ; pageIndex += 1) {
    const from = pageIndex * DELETE_PRODUCT_PAGE_SIZE
    const to = from + DELETE_PRODUCT_PAGE_SIZE - 1
    const page = await fetchPage(from, to)
    rows.push(...page)
    if (page.length < DELETE_PRODUCT_PAGE_SIZE) return rows
  }
}

const fetchProductImagePaths = async (productId: string): Promise<string[]> => {
  const productImages = await fetchAllPagedRows(async (from, to) => {
    const { data, error } = await supabase
      .from('product_image')
      .select('storage_path')
      .eq('product_id', productId)
      .range(from, to)
    if (error) throw error
    return data ?? []
  })

  return productImages.map((productImage) => productImage.storage_path)
}

const fetchReviewImagePaths = async (productId: string): Promise<string[]> => {
  const reviewImages = await fetchAllPagedRows(async (from, to) => {
    const { data, error } = await supabase
      .from('review_image')
      .select('storage_path, review!inner(product_id)')
      .eq('review.product_id', productId)
      .range(from, to)
    if (error) throw error
    return data ?? []
  })

  return reviewImages.map((reviewImage) => reviewImage.storage_path)
}

const startProductDeletion = async (id: string): Promise<void> => {
  const { error } = await supabase.from('pending_product_deletion').insert({ product_id: id })
  if (error?.code === '23505' && error.message.includes(PENDING_PRODUCT_DELETION_PRIMARY_KEY)) {
    return
  }
  if (error) throw error
}

const clearProductDeletion = async (id: string): Promise<void> => {
  const { error } = await supabase.from('pending_product_deletion').delete().eq('product_id', id)
  if (error) throw error
}

export const deleteProduct = async (id: string): Promise<void> => {
  await startProductDeletion(id)

  try {
    const [productImagePaths, reviewImagePaths] = await Promise.all([
      fetchProductImagePaths(id),
      fetchReviewImagePaths(id),
    ])

    if (productImagePaths.length) {
      await deleteImageVariants(
        {
          removeVariants: async (paths) => {
            const { error: removeError } = await supabase.storage
              .from(PRODUCT_IMAGE_BUCKET)
              .remove(paths)
            if (removeError) throw removeError
          },
        },
        productImagePaths,
      )
    }

    if (reviewImagePaths.length) {
      await deleteImageVariants(
        {
          removeVariants: async (paths) => {
            const { error: removeError } = await supabase.storage
              .from(REVIEW_IMAGE_BUCKET)
              .remove(paths)
            if (removeError) throw removeError
          },
        },
        reviewImagePaths,
      )
    }

    const { error } = await supabase.from('product').delete().eq('id', id)
    if (error) throw error
  } catch (error) {
    await clearProductDeletion(id).catch(() => undefined)
    throw error
  }
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
