-- Categories, bases and tags are snake_case English
-- Validation and localization is handled by the frontend

CREATE EXTENSION IF NOT EXISTS pg_trgm;CREATE TABLE public.profile (
  id           uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     text    UNIQUE NOT NULL
                       CHECK (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text,
  bio          text,
  is_admin     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product (
  id              uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text       NOT NULL CHECK (length(trim(name)) >= 2),
  brand           text,
  description     text,
  category        text       NOT NULL,
  base            text,
  created_by      uuid       NOT NULL REFERENCES public.profile(id),
  normalized_name text       GENERATED ALWAYS AS (lower(trim(name))) STORED,
  -- Denormalized aggregate values; kept in sync by trigger
  avg_overall     numeric(3, 2),
  ratings_count   integer    NOT NULL DEFAULT 0,
  avg_price       numeric(8, 2),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.product.avg_overall IS 'avg of overall (only is_current=true rows)';

CREATE TABLE public.product_image (
  id           uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid       NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  storage_path text       NOT NULL,
  sort_order   smallint   NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.rating (
  id          uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid       NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  user_id     uuid       NOT NULL REFERENCES public.profile(id),
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
COMMENT ON COLUMN public.rating.is_current IS 'false when superseded by a newer rating from the same user';

CREATE TABLE public.rating_tag (
  rating_id uuid NOT NULL REFERENCES public.rating(id) ON DELETE CASCADE,
  tag       text NOT NULL,
  PRIMARY KEY (rating_id, tag)
);

CREATE TABLE public.rating_image (
  id           uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id    uuid       NOT NULL REFERENCES public.rating(id) ON DELETE CASCADE,
  storage_path text       NOT NULL,
  sort_order   smallint   NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_category_idx      ON public.product (category);
CREATE INDEX product_base_idx          ON public.product (base);
CREATE INDEX product_created_by_idx    ON public.product (created_by);
CREATE INDEX product_created_at_idx    ON public.product (created_at DESC);
CREATE INDEX product_avg_overall_idx   ON public.product (avg_overall DESC NULLS LAST);
CREATE INDEX product_ratings_count_idx ON public.product (ratings_count DESC);
-- Enables LIKE/ILIKE search on normalized_name via trigrams
CREATE INDEX product_name_trgm_idx     ON public.product USING gin (normalized_name gin_trgm_ops);
-- Prevents duplicate name+brand combinations
CREATE UNIQUE INDEX product_dedupe_idx
  ON public.product (normalized_name, coalesce(lower(trim(brand)), ''));

CREATE INDEX rating_product_id_idx ON public.rating (product_id);
CREATE INDEX rating_user_id_idx    ON public.rating (user_id);
CREATE INDEX rating_created_at_idx ON public.rating (created_at DESC);
CREATE INDEX rating_current_idx    ON public.rating (product_id, is_current)
  WHERE is_current = true;
-- Exactly one active rating per user per product
CREATE UNIQUE INDEX rating_one_current_per_user_idx
  ON public.rating (product_id, user_id)
  WHERE is_current = true;
