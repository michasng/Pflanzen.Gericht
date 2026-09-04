CREATE TABLE public.product_ingredient (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           uuid        NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  name                 text        NOT NULL CHECK (length(trim(name)) >= 1),
  fraction_basis_points integer    CHECK (fraction_basis_points IS NULL
                                          OR (fraction_basis_points >= 0 AND fraction_basis_points <= 10000)),
  comparator           text        NOT NULL DEFAULT '=' CHECK (comparator IN ('=', '≈', '<', '≤', '≥', '>')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  CHECK (fraction_basis_points IS NOT NULL OR comparator = '=')
);
COMMENT ON COLUMN public.product_ingredient.fraction_basis_points IS
  'share of the product in basis points (1 bp = 0.01 %); null means the fraction is unknown';
COMMENT ON COLUMN public.product_ingredient.comparator IS
  'symbol shown before the fraction, e.g. "≤" in "Alkohol ≤ 0,5 %"; only meaningful when fraction_basis_points is set';

CREATE INDEX product_ingredient_product_id_idx ON public.product_ingredient (product_id);
-- trigram index enables ILIKE suggestions while typing an ingredient name
CREATE INDEX product_ingredient_name_trgm_idx ON public.product_ingredient USING gin (name gin_trgm_ops);
CREATE UNIQUE INDEX product_ingredient_dedupe_idx
  ON public.product_ingredient (product_id, lower(trim(name)));

ALTER TABLE public.product_ingredient ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_ingredients: publicly readable"
  ON public.product_ingredient FOR SELECT USING (true);

CREATE POLICY "product_ingredients: product owner add"
  ON public.product_ingredient FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "product_ingredients: product owner delete"
  ON public.product_ingredient FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

GRANT SELECT ON public.product_ingredient TO anon, authenticated;
GRANT INSERT, DELETE ON public.product_ingredient TO authenticated;

-- CREATE OR REPLACE with additional trailing parameters would create a second
-- overload instead of replacing the function, making every call ambiguous.
-- Drop the prior signature first so only the extended version remains.
DROP FUNCTION IF EXISTS public.search_products(
  text, text, text, numeric, text, text, integer, integer, text[], text, integer, integer
);

CREATE FUNCTION public.search_products(
  p_search              text    DEFAULT '',
  p_category            text    DEFAULT NULL,
  p_base                text    DEFAULT NULL,
  p_min_rating          numeric DEFAULT NULL,
  p_store               text    DEFAULT NULL,
  p_city                text    DEFAULT NULL,
  p_min_price           integer DEFAULT NULL,
  p_max_price           integer DEFAULT NULL,
  p_tags                text[]  DEFAULT NULL,
  p_sort                text    DEFAULT 'newest',
  p_limit               integer DEFAULT 20,
  p_offset              integer DEFAULT 0,
  p_include_ingredients text[]  DEFAULT NULL,
  p_exclude_ingredients text[]  DEFAULT NULL
)
RETURNS TABLE (
  id                   uuid,
  name                 text,
  brand                text,
  description          text,
  category             text,
  base                 text,
  created_by           uuid,
  normalized_name      text,
  avg_overall          numeric,
  ratings_count        integer,
  min_price_euro_cents integer,
  created_at           timestamptz,
  updated_at           timestamptz,
  tags                 text[],
  total_count          bigint
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.brand,
    p.description,
    p.category,
    p.base,
    p.created_by,
    p.normalized_name,
    p.avg_overall,
    p.ratings_count,
    p.min_price_euro_cents,
    p.created_at,
    p.updated_at,
    p.tags,
    count(*) OVER () AS total_count
  FROM public.product p
  WHERE
    (p_search    IS NULL OR p_search = '' OR p.normalized_name ILIKE '%' || lower(trim(p_search)) || '%')
    AND (p_category  IS NULL OR p.category = p_category)
    AND (p_base      IS NULL OR p.base     = p_base)
    AND (p_min_rating IS NULL OR p.avg_overall >= p_min_rating)
    AND (p_min_price  IS NULL OR p.min_price_euro_cents >= p_min_price)
    AND (p_max_price  IS NULL OR p.min_price_euro_cents <= p_max_price)
    AND (p_tags IS NULL OR array_length(p_tags, 1) IS NULL OR p.tags @> p_tags)
    AND (
      p_store IS NULL OR EXISTS (
        SELECT 1 FROM public.price_report pr
        WHERE  pr.product_id = p.id
          AND  pr.store = p_store
          AND  (p_city IS NULL OR p_city = '' OR pr.city_name = p_city)
      )
    )
    AND (
      p_include_ingredients IS NULL OR array_length(p_include_ingredients, 1) IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p_include_ingredients) AS wanted(name)
        WHERE NOT EXISTS (
          SELECT 1 FROM public.product_ingredient pi
          WHERE pi.product_id = p.id
            AND lower(trim(pi.name)) = lower(trim(wanted.name))
        )
      )
    )
    AND (
      p_exclude_ingredients IS NULL OR array_length(p_exclude_ingredients, 1) IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.product_ingredient pi
        WHERE pi.product_id = p.id
          AND lower(trim(pi.name)) = ANY (SELECT lower(trim(x)) FROM unnest(p_exclude_ingredients) AS x)
      )
    )
  ORDER BY
    CASE WHEN p_sort = 'top_rated'   THEN p.avg_overall                   END DESC NULLS LAST,
    CASE WHEN p_sort = 'most_rated'  THEN p.ratings_count::numeric         END DESC NULLS LAST,
    CASE WHEN p_sort = 'price_asc'   THEN p.min_price_euro_cents::numeric  END ASC  NULLS LAST,
    CASE WHEN p_sort = 'price_desc'  THEN p.min_price_euro_cents::numeric  END DESC NULLS LAST,
    CASE WHEN p_sort = 'newest' OR p_sort IS NULL THEN extract(epoch FROM p.created_at) END DESC NULLS LAST
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_products TO anon, authenticated;
