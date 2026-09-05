import type { Tables, TablesInsert, TablesUpdate } from './database'

export type Profile = Tables<'profile'>
export type ProfileInsert = TablesInsert<'profile'>
export type ProfileUpdate = TablesUpdate<'profile'>

export type Product = Tables<'product'>
export type ProductInsert = TablesInsert<'product'>
export type ProductUpdate = TablesUpdate<'product'>

export type ProductImage = Tables<'product_image'>
export type ProductImageInsert = TablesInsert<'product_image'>

export type ProductIngredient = Tables<'product_ingredient'>
export type ProductIngredientInsert = TablesInsert<'product_ingredient'>

export type ProductNutrient = Tables<'product_nutrient'>
export type ProductNutrientInsert = TablesInsert<'product_nutrient'>

export type Rating = Tables<'rating'>
export type RatingInsert = TablesInsert<'rating'>
export type RatingUpdate = TablesUpdate<'rating'>

export type RatingImage = Tables<'rating_image'>
export type RatingImageInsert = TablesInsert<'rating_image'>

export type RatingTag = Tables<'rating_tag'>

export type PriceReport = Tables<'price_report'>
export type PriceReportInsert = TablesInsert<'price_report'>
export type PriceReportUpdate = TablesUpdate<'price_report'>
