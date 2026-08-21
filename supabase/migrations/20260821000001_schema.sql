-- Categories, bases, tags and locations are typed text strings (snake_case) with CHECK constraints;
-- localization is handled exclusively in the frontend.

CREATE EXTENSION IF NOT EXISTS pg_trgm;CREATE TABLE public.profiles (
  id           uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     text    UNIQUE NOT NULL
                       CHECK (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text,
  bio          text,
  is_admin     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id              uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text       NOT NULL CHECK (length(trim(name)) >= 2),
  brand           text,
  description     text,
  category        text       NOT NULL
                             CONSTRAINT products_category_check CHECK (category IN (
                               'meat_alternative','cheese','milk','eggs','cold_cuts','sausage',
                               'fish_alternative','yogurt','ice_cream','spread','snack','sweets',
                               'ready_meal','original'
                             )),
  base            text
                             CONSTRAINT products_base_check CHECK (base IN (
                               'soy','pea','oat','wheat','lupin','chickpea','almond','cashew',
                               'coconut','rice','hemp','tofu','seitan','mycoprotein','blend'
                             )),
  created_by      uuid       NOT NULL REFERENCES public.profiles(id),
  normalized_name text       GENERATED ALWAYS AS (lower(trim(name))) STORED,
  -- Denormalized aggregate values; kept in sync by trigger
  avg_overall     numeric(3, 2),
  ratings_count   integer    NOT NULL DEFAULT 0,
  avg_price       numeric(8, 2),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.products.avg_overall IS 'avg of overall (only is_current=true rows)';

CREATE TABLE public.product_images (
  id           uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid       NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path text       NOT NULL,
  sort_order   smallint   NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ratings (
  id          uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid       NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     uuid       NOT NULL REFERENCES public.profiles(id),
  overall     smallint   NOT NULL CHECK (overall BETWEEN 1 AND 5),
  taste       smallint   CHECK (taste       BETWEEN 1 AND 5),
  consistency smallint   CHECK (consistency BETWEEN 1 AND 5),
  appearance  smallint   CHECK (appearance  BETWEEN 1 AND 5),
  nutrition   smallint   CHECK (nutrition   BETWEEN 1 AND 5),
  value       smallint   CHECK (value       BETWEEN 1 AND 5),
  comment     text,
  -- Free text; frontend suggests known store chains
  location    text,
  price       numeric(8, 2) CHECK (price >= 0),
  is_current  boolean    NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.ratings.is_current IS 'false when superseded by a newer rating from the same user';

CREATE TABLE public.rating_tags (
  rating_id uuid NOT NULL REFERENCES public.ratings(id) ON DELETE CASCADE,
  tag       text NOT NULL
                 CONSTRAINT rating_tags_tag_check CHECK (tag IN (
                   'sustainable_packaging','lots_of_plastic','clean_ingredients','low_sugar',
                   'high_protein','gluten_free','soy_free','organic','no_palm_oil',
                   'few_ingredients','melts_well','kid_friendly','budget_friendly','expensive',
                   'easy_to_prepare','very_similar','meaty_flavor','cheesy_flavor'
                 )),
  PRIMARY KEY (rating_id, tag)
);

CREATE TABLE public.rating_images (
  id           uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id    uuid       NOT NULL REFERENCES public.ratings(id) ON DELETE CASCADE,
  storage_path text       NOT NULL,
  sort_order   smallint   NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_category_idx      ON public.products (category);
CREATE INDEX products_base_idx          ON public.products (base);
CREATE INDEX products_created_by_idx    ON public.products (created_by);
CREATE INDEX products_created_at_idx    ON public.products (created_at DESC);
CREATE INDEX products_avg_overall_idx   ON public.products (avg_overall DESC NULLS LAST);
CREATE INDEX products_ratings_count_idx ON public.products (ratings_count DESC);
-- Enables LIKE/ILIKE search on normalized_name via trigrams
CREATE INDEX products_name_trgm_idx     ON public.products USING gin (normalized_name gin_trgm_ops);
-- Prevents duplicate name+brand combinations
CREATE UNIQUE INDEX products_dedupe_idx
  ON public.products (normalized_name, coalesce(lower(trim(brand)), ''));

CREATE INDEX ratings_product_id_idx ON public.ratings (product_id);
CREATE INDEX ratings_user_id_idx    ON public.ratings (user_id);
CREATE INDEX ratings_created_at_idx ON public.ratings (created_at DESC);
CREATE INDEX ratings_current_idx    ON public.ratings (product_id, is_current)
  WHERE is_current = true;
-- Exactly one active rating per user per product
CREATE UNIQUE INDEX ratings_one_current_per_user_idx
  ON public.ratings (product_id, user_id)
  WHERE is_current = true;
