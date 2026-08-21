export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  is_admin: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  brand: string | null
  description: string | null
  /** Typed string; localized in src/config/taxonomy.ts */
  category: string
  /** Typed string; localized in src/config/taxonomy.ts */
  base: string | null
  created_by: string
  /** Computed: lower(trim(name)); used for deduplication */
  normalized_name: string
  /** Denormalized; kept in sync by trigger */
  avg_overall: number | null
  ratings_count: number
  avg_price: number | null
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  storage_path: string
  sort_order: number
  created_at: string
}

export interface Rating {
  id: string
  product_id: string
  user_id: string
  overall: number
  taste: number | null
  consistency: number | null
  appearance: number | null
  nutrition: number | null
  value: number | null
  comment: string | null
  /** Free text; frontend suggests known store chains */
  location: string | null
  price: number | null
  /** false when superseded by a newer rating from the same user; excluded from aggregates */
  is_current: boolean
  created_at: string
  updated_at: string
}

export interface RatingTag {
  rating_id: string
  /** Typed string; localized in src/config/taxonomy.ts */
  tag: string
}

export interface RatingImage {
  id: string
  rating_id: string
  storage_path: string
  sort_order: number
  created_at: string
}

export interface ProductWithDetails extends Product {
  product_image: ProductImage[]
}

export interface RatingWithDetails extends Rating {
  profile: Pick<Profile, 'username' | 'display_name'>
  rating_tag: Array<{ tag: string }>
  rating_image: RatingImage[]
}

export interface Database {
  public: {
    Tables: {
      profile: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'is_admin'> & { is_admin?: boolean }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      product: {
        Row: Product
        Insert: Omit<
          Product,
          | 'id'
          | 'normalized_name'
          | 'avg_overall'
          | 'ratings_count'
          | 'avg_price'
          | 'created_at'
          | 'updated_at'
        >
        Update: Partial<Omit<Product, 'id' | 'normalized_name' | 'created_by' | 'created_at'>>
      }
      product_image: {
        Row: ProductImage
        Insert: Omit<ProductImage, 'id' | 'created_at'>
        Update: Partial<Omit<ProductImage, 'id' | 'product_id' | 'created_at'>>
      }
      rating: {
        Row: Rating
        Insert: Omit<Rating, 'id' | 'is_current' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Rating, 'id' | 'product_id' | 'user_id' | 'is_current' | 'created_at'>>
      }
      rating_tag: {
        Row: RatingTag
        Insert: RatingTag
        Update: never
      }
      rating_image: {
        Row: RatingImage
        Insert: Omit<RatingImage, 'id' | 'created_at'>
        Update: Partial<Omit<RatingImage, 'id' | 'rating_id' | 'created_at'>>
      }
    }
  }
}
