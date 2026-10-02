import type { CamelCasedKeys } from '@/lib/CamelCasedKeys'
import type { Tables, TablesInsert, TablesUpdate } from './database'

export type Profile = CamelCasedKeys<Tables<'profile'>>
export type ProfileInsert = CamelCasedKeys<TablesInsert<'profile'>>
export type ProfileUpdate = CamelCasedKeys<TablesUpdate<'profile'>>

export type Product = CamelCasedKeys<Tables<'product'>>
export type ProductInsert = CamelCasedKeys<TablesInsert<'product'>>
export type ProductUpdate = CamelCasedKeys<TablesUpdate<'product'>>

export type ProductImage = CamelCasedKeys<Tables<'product_image'>>
export type ProductImageInsert = CamelCasedKeys<TablesInsert<'product_image'>>

export type ProductIngredient = CamelCasedKeys<Tables<'product_ingredient'>>
export type ProductIngredientInsert = CamelCasedKeys<TablesInsert<'product_ingredient'>>

export type ProductNutrient = CamelCasedKeys<Tables<'product_nutrient'>>
export type ProductNutrientInsert = CamelCasedKeys<TablesInsert<'product_nutrient'>>

export type ProductSimilarityVote = CamelCasedKeys<Tables<'product_similarity_vote'>>
export type ProductSimilarityVoteInsert = CamelCasedKeys<TablesInsert<'product_similarity_vote'>>
export type ProductSimilarityVoteUpdate = CamelCasedKeys<TablesUpdate<'product_similarity_vote'>>

export type Review = CamelCasedKeys<Tables<'review'>>
export type ReviewInsert = CamelCasedKeys<TablesInsert<'review'>>
export type ReviewUpdate = CamelCasedKeys<TablesUpdate<'review'>>

export type ReviewImage = CamelCasedKeys<Tables<'review_image'>>
export type ReviewImageInsert = CamelCasedKeys<TablesInsert<'review_image'>>

export type ReviewTag = CamelCasedKeys<Tables<'review_tag'>>

export type PriceReport = CamelCasedKeys<Tables<'price_report'>>
export type PriceReportInsert = CamelCasedKeys<TablesInsert<'price_report'>>
export type PriceReportUpdate = CamelCasedKeys<TablesUpdate<'price_report'>>
