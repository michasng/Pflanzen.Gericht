CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.profile (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     text        UNIQUE NOT NULL
                           CHECK (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text,
  bio          text,
  is_admin     boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL CHECK (length(trim(name)) >= 2),
  brand           text,
  description     text,
  category        text        NOT NULL,
  base            text,
  allergens       text[]      NOT NULL DEFAULT '{}',
  is_organic      boolean     NOT NULL DEFAULT false,
  energy_joules   integer     CHECK (energy_joules IS NULL OR energy_joules >= 0),
  created_by      uuid        NOT NULL REFERENCES public.profile(id),
  normalized_name text        GENERATED ALWAYS AS (lower(trim(name))) STORED,
  avg_overall          numeric(3, 2),
  reviews_count        integer     NOT NULL DEFAULT 0,
  min_price_euro_cents integer,
  tags                 text[]      NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.product_image (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid        NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  storage_path text        NOT NULL,
  sort_order   smallint    NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_ingredient (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            uuid        NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  name                  text        NOT NULL CHECK (length(trim(name)) >= 1),
  fraction_basis_points integer     CHECK (fraction_basis_points IS NULL
                                            OR (fraction_basis_points >= 0 AND fraction_basis_points <= 10000)),
  comparator            text        NOT NULL DEFAULT '=' CHECK (comparator IN ('=', '≈', '<', '≤', '≥', '>')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (fraction_basis_points IS NOT NULL OR comparator = '=')
);
CREATE TABLE public.product_nutrient (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        uuid        NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  name              text        NOT NULL CHECK (length(trim(name)) >= 1),
  amount_micrograms bigint      NOT NULL CHECK (amount_micrograms >= 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.review (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid        NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profile(id),
  overall     smallint    NOT NULL CHECK (overall BETWEEN 1 AND 5),
  taste       smallint    CHECK (taste       BETWEEN 1 AND 5),
  consistency smallint    CHECK (consistency BETWEEN 1 AND 5),
  appearance  smallint    CHECK (appearance  BETWEEN 1 AND 5),
  nutrition   smallint    CHECK (nutrition   BETWEEN 1 AND 5),
  value       smallint    CHECK (value       BETWEEN 1 AND 5),
  comment     text,
  is_current  boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.review_tag (
  review_id uuid NOT NULL REFERENCES public.review(id) ON DELETE CASCADE,
  tag       text NOT NULL,
  PRIMARY KEY (review_id, tag)
);

CREATE TABLE public.review_image (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    uuid        NOT NULL REFERENCES public.review(id) ON DELETE CASCADE,
  storage_path text        NOT NULL,
  sort_order   smallint    NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.price_report (
  id                         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id                 uuid    NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  user_id                    uuid    NOT NULL REFERENCES public.profile(id),
  store                      text    NOT NULL CHECK (length(trim(store)) >= 1),
  city_name                  text    NOT NULL DEFAULT '',
  price_euro_cents           integer NOT NULL CHECK (price_euro_cents >= 0),
  sale_price_euro_cents      integer          CHECK (sale_price_euro_cents >= 0),
  effective_price_euro_cents integer GENERATED ALWAYS AS
    (coalesce(sale_price_euro_cents, price_euro_cents)) STORED,
  observed_at                date    NOT NULL DEFAULT current_date,
  created_at                 timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_category_idx        ON public.product (category);
CREATE INDEX product_base_idx            ON public.product (base);
CREATE INDEX product_created_by_idx      ON public.product (created_by);
CREATE INDEX product_created_at_idx      ON public.product (created_at DESC);
CREATE INDEX product_avg_overall_idx     ON public.product (avg_overall DESC NULLS LAST);
CREATE INDEX product_reviews_count_idx   ON public.product (reviews_count DESC);
CREATE INDEX product_min_price_idx       ON public.product (min_price_euro_cents ASC NULLS LAST);
CREATE INDEX product_allergens_gin_idx   ON public.product USING gin (allergens);
CREATE INDEX product_is_organic_idx      ON public.product (is_organic) WHERE is_organic = true;
CREATE INDEX product_name_trgm_idx       ON public.product USING gin (normalized_name gin_trgm_ops);
CREATE INDEX product_tags_gin_idx        ON public.product USING gin (tags);
CREATE UNIQUE INDEX product_dedupe_idx
  ON public.product (normalized_name, coalesce(lower(trim(brand)), ''));

CREATE INDEX product_ingredient_product_id_idx ON public.product_ingredient (product_id);
CREATE INDEX product_ingredient_name_trgm_idx  ON public.product_ingredient USING gin (name gin_trgm_ops);
CREATE UNIQUE INDEX product_ingredient_dedupe_idx
  ON public.product_ingredient (product_id, lower(trim(name)));

CREATE INDEX product_nutrient_product_id_idx ON public.product_nutrient (product_id);
CREATE INDEX product_nutrient_name_trgm_idx  ON public.product_nutrient USING gin (name gin_trgm_ops);
CREATE UNIQUE INDEX product_nutrient_dedupe_idx
  ON public.product_nutrient (product_id, lower(trim(name)));

CREATE INDEX review_product_id_idx ON public.review (product_id);
CREATE INDEX review_user_id_idx    ON public.review (user_id);
CREATE INDEX review_created_at_idx ON public.review (created_at DESC);
CREATE INDEX review_current_idx    ON public.review (product_id, is_current)
  WHERE is_current = true;
CREATE UNIQUE INDEX review_one_current_per_user_idx
  ON public.review (product_id, user_id)
  WHERE is_current = true;

CREATE UNIQUE INDEX price_report_user_store_city_idx
  ON public.price_report (product_id, user_id, store, city_name);
CREATE INDEX price_report_product_id_idx      ON public.price_report (product_id);
CREATE INDEX price_report_effective_price_idx ON public.price_report (effective_price_euro_cents);
