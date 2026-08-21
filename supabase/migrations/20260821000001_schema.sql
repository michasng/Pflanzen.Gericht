-- Migration 1: Schema
-- Tabellen, Indizes und Constraints für Pflanzen.Gericht

-- ---------------------------------------------------------------------------
-- Erweiterungen
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Trigram-Suche auf Produktnamen

-- Kategorien, Basen, Tags und Fundorte werden nicht als Tabellen abgebildet.
-- Stattdessen: typisierte Text-Strings (snake_case, Englisch) mit CHECK-Constraints
-- im Schema; die Lokalisierung findet ausschließlich im Frontend statt.

-- ---------------------------------------------------------------------------
-- Profile (1:1 zu auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id           uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     text    UNIQUE NOT NULL
                       CHECK (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text,
  bio          text,
  is_admin     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Öffentliche Nutzerprofile';

-- ---------------------------------------------------------------------------
-- Produkte
-- ---------------------------------------------------------------------------
CREATE TABLE public.products (
  id              uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text       NOT NULL CHECK (length(trim(name)) >= 2),
  brand           text,
  description     text,
  -- Kategorie und Basis: typisierte Strings, im Frontend lokalisiert
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
  -- Generierte Spalte für Deduplizierung
  normalized_name text       GENERATED ALWAYS AS (lower(trim(name))) STORED,
  -- Denormalisierte Aggregatwerte (per Trigger aktuell gehalten)
  avg_overall     numeric(3, 2),
  ratings_count   integer    NOT NULL DEFAULT 0,
  avg_price       numeric(8, 2),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.products IS 'Vegane Produkte';
COMMENT ON COLUMN public.products.normalized_name IS 'Normalisierter Name für Deduplizierung';
COMMENT ON COLUMN public.products.avg_overall     IS 'Ø Gesamtbewertung (nur is_current=true)';
COMMENT ON COLUMN public.products.ratings_count   IS 'Anzahl aktiver Bewertungen';

CREATE TABLE public.product_images (
  id           uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid       NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path text       NOT NULL,
  sort_order   smallint   NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Bewertungen
-- ---------------------------------------------------------------------------
CREATE TABLE public.ratings (
  id          uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid       NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     uuid       NOT NULL REFERENCES public.profiles(id),
  -- Pflichtfeld
  overall     smallint   NOT NULL CHECK (overall BETWEEN 1 AND 5),
  -- Optionale Einzelkriterien
  taste       smallint   CHECK (taste       BETWEEN 1 AND 5),
  consistency smallint   CHECK (consistency BETWEEN 1 AND 5),
  appearance  smallint   CHECK (appearance  BETWEEN 1 AND 5),
  nutrition   smallint   CHECK (nutrition   BETWEEN 1 AND 5),
  value       smallint   CHECK (value       BETWEEN 1 AND 5),
  comment     text,
  -- Fundort: Freitext (Frontend schlägt bekannte Ketten vor)
  location    text,
  price       numeric(8, 2) CHECK (price >= 0),
  -- false = durch neuere Bewertung überholt; zählt nicht in Aggregaten
  is_current  boolean    NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ratings IS 'Produktbewertungen';
COMMENT ON COLUMN public.ratings.is_current IS 'false wenn durch neuere Bewertung desselben Nutzers überholt';

CREATE TABLE public.rating_tags (
  rating_id uuid NOT NULL REFERENCES public.ratings(id) ON DELETE CASCADE,
  -- Tag: typisierter String, im Frontend lokalisiert
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

-- ---------------------------------------------------------------------------
-- Indizes
-- ---------------------------------------------------------------------------

-- Produkte
CREATE INDEX products_category_idx      ON public.products (category);
CREATE INDEX products_base_idx          ON public.products (base);
CREATE INDEX products_created_by_idx    ON public.products (created_by);
CREATE INDEX products_created_at_idx    ON public.products (created_at DESC);
CREATE INDEX products_avg_overall_idx   ON public.products (avg_overall DESC NULLS LAST);
CREATE INDEX products_ratings_count_idx ON public.products (ratings_count DESC);
-- Trigram-Index für Produktname-Suche
CREATE INDEX products_name_trgm_idx     ON public.products USING gin (normalized_name gin_trgm_ops);
-- Deduplizierung: gleiche Name+Marke-Kombination verhindern
CREATE UNIQUE INDEX products_dedupe_idx
  ON public.products (normalized_name, coalesce(lower(trim(brand)), ''));

-- Bewertungen
CREATE INDEX ratings_product_id_idx ON public.ratings (product_id);
CREATE INDEX ratings_user_id_idx    ON public.ratings (user_id);
CREATE INDEX ratings_created_at_idx ON public.ratings (created_at DESC);
-- Schneller Zugriff auf aktive Bewertungen
CREATE INDEX ratings_current_idx    ON public.ratings (product_id, is_current)
  WHERE is_current = true;
-- Genau eine aktive Bewertung pro Nutzer pro Produkt
CREATE UNIQUE INDEX ratings_one_current_per_user_idx
  ON public.ratings (product_id, user_id)
  WHERE is_current = true;
