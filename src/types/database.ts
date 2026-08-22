export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      price_report: {
        Row: {
          city_name: string
          created_at: string
          effective_price_euro_cents: number | null
          id: string
          observed_at: string
          price_euro_cents: number
          product_id: string
          sale_price_euro_cents: number | null
          store: string
          user_id: string
        }
        Insert: {
          city_name?: string
          created_at?: string
          effective_price_euro_cents?: number | null
          id?: string
          observed_at?: string
          price_euro_cents: number
          product_id: string
          sale_price_euro_cents?: number | null
          store: string
          user_id: string
        }
        Update: {
          city_name?: string
          created_at?: string
          effective_price_euro_cents?: number | null
          id?: string
          observed_at?: string
          price_euro_cents?: number
          product_id?: string
          sale_price_euro_cents?: number | null
          store?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'price_report_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'price_report_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profile'
            referencedColumns: ['id']
          },
        ]
      }
      product: {
        Row: {
          avg_overall: number | null
          base: string | null
          brand: string | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          min_price_euro_cents: number | null
          name: string
          normalized_name: string | null
          ratings_count: number
          updated_at: string
        }
        Insert: {
          avg_overall?: number | null
          base?: string | null
          brand?: string | null
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          min_price_euro_cents?: number | null
          name: string
          normalized_name?: string | null
          ratings_count?: number
          updated_at?: string
        }
        Update: {
          avg_overall?: number | null
          base?: string | null
          brand?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          min_price_euro_cents?: number | null
          name?: string
          normalized_name?: string | null
          ratings_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profile'
            referencedColumns: ['id']
          },
        ]
      }
      product_image: {
        Row: {
          created_at: string
          id: string
          product_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_image_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product'
            referencedColumns: ['id']
          },
        ]
      }
      profile: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_admin: boolean
          username: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_admin?: boolean
          username: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_admin?: boolean
          username?: string
        }
        Relationships: []
      }
      rating: {
        Row: {
          appearance: number | null
          comment: string | null
          consistency: number | null
          created_at: string
          id: string
          is_current: boolean
          nutrition: number | null
          overall: number
          product_id: string
          taste: number | null
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          appearance?: number | null
          comment?: string | null
          consistency?: number | null
          created_at?: string
          id?: string
          is_current?: boolean
          nutrition?: number | null
          overall: number
          product_id: string
          taste?: number | null
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          appearance?: number | null
          comment?: string | null
          consistency?: number | null
          created_at?: string
          id?: string
          is_current?: boolean
          nutrition?: number | null
          overall?: number
          product_id?: string
          taste?: number | null
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'rating_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rating_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profile'
            referencedColumns: ['id']
          },
        ]
      }
      rating_image: {
        Row: {
          created_at: string
          id: string
          rating_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          rating_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rating_image_rating_id_fkey'
            columns: ['rating_id']
            isOneToOne: false
            referencedRelation: 'rating'
            referencedColumns: ['id']
          },
        ]
      }
      rating_tag: {
        Row: {
          rating_id: string
          tag: string
        }
        Insert: {
          rating_id: string
          tag: string
        }
        Update: {
          rating_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rating_tag_rating_id_fkey'
            columns: ['rating_id']
            isOneToOne: false
            referencedRelation: 'rating'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { '': string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
