// Wird in Phase 2 durch `supabase gen types` ergänzt/ersetzt.
// Manuelle Typdefinitionen spiegeln das geplante Datenbankschema.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ---------------------------------------------------------------------------
// Tabellen-Zeilentypen
// ---------------------------------------------------------------------------

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
  /** Typisierter String; Lokalisierung via src/config/taxonomy.ts */
  category: string
  /** Typisierter String; Lokalisierung via src/config/taxonomy.ts */
  base: string | null
  created_by: string
  /** Computed: lower(trim(name)) für Duplikat-Erkennung */
  normalized_name: string
  /** Denormalisiert, per Trigger aktualisiert */
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
  /** Freitext; Frontend schlägt bekannte Ketten vor */
  location: string | null
  price: number | null
  /** false = durch neuere Bewertung überholt; fließt nicht in Aggregate ein */
  is_current: boolean
  created_at: string
  updated_at: string
}

export interface RatingTag {
  rating_id: string
  /** Typisierter String; Lokalisierung via src/config/taxonomy.ts */
  tag: string
}

export interface RatingImage {
  id: string
  rating_id: string
  storage_path: string
  sort_order: number
  created_at: string
}

// ---------------------------------------------------------------------------
// Erweiterte Typen mit Joins (für Frontend-Abfragen)
// ---------------------------------------------------------------------------

export interface ProductWithDetails extends Product {
  product_images: ProductImage[]
}

export interface RatingWithDetails extends Rating {
  profiles: Pick<Profile, 'username' | 'display_name'>
  rating_tags: Array<{ tag: string }>
  rating_images: RatingImage[]
}

// ---------------------------------------------------------------------------
// Supabase Database-Typ (für createClient<Database>)
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'is_admin'> & { is_admin?: boolean }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      products: {
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
      product_images: {
        Row: ProductImage
        Insert: Omit<ProductImage, 'id' | 'created_at'>
        Update: Partial<Omit<ProductImage, 'id' | 'product_id' | 'created_at'>>
      }
      ratings: {
        Row: Rating
        Insert: Omit<Rating, 'id' | 'is_current' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Rating, 'id' | 'product_id' | 'user_id' | 'is_current' | 'created_at'>>
      }
      rating_tags: {
        Row: RatingTag
        Insert: RatingTag
        Update: never
      }
      rating_images: {
        Row: RatingImage
        Insert: Omit<RatingImage, 'id' | 'created_at'>
        Update: Partial<Omit<RatingImage, 'id' | 'rating_id' | 'created_at'>>
      }
    }
  }
}
