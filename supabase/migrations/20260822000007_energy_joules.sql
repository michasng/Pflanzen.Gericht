ALTER TABLE public.product RENAME COLUMN energy_kilojoules TO energy_joules;
COMMENT ON COLUMN public.product.energy_joules IS
  'energy content in J per 100 g/ml of product, as sold; null means unknown';

DROP FUNCTION IF EXISTS public.search_products(
  text, text, text, numeric, text, text, integer, integer, text[], text, integer, integer, text[], text[]
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
  energy_joules        integer,
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
  WITH filtered_products AS (
    SELECT p.*
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
  ),
  ingredient_stats AS (
    SELECT
      pi.product_id,
      count(*)::integer AS ingredient_count
    FROM public.product_ingredient pi
    INNER JOIN filtered_products p ON p.id = pi.product_id
    GROUP BY pi.product_id
  ),
  nutrient_sort_values AS (
    SELECT
      pn.product_id,
      max(pn.amount_micrograms) FILTER (
        WHERE lower(trim(pn.name)) = ANY (ARRAY['fett'])
      ) AS fat_amount_micrograms,
      max(pn.amount_micrograms) FILTER (
        WHERE lower(trim(pn.name)) = ANY (ARRAY['gesättigte fettsäuren', 'davon gesättigte fettsäuren'])
      ) AS saturated_fat_amount_micrograms,
      max(pn.amount_micrograms) FILTER (
        WHERE lower(trim(pn.name)) = ANY (ARRAY['zucker', 'davon zucker'])
      ) AS sugar_amount_micrograms,
      max(pn.amount_micrograms) FILTER (
        WHERE lower(trim(pn.name)) = ANY (ARRAY['eiweiß', 'eiweiss', 'protein'])
      ) AS protein_amount_micrograms,
      max(pn.amount_micrograms) FILTER (
        WHERE lower(trim(pn.name)) = ANY (ARRAY['ballaststoffe'])
      ) AS fiber_amount_micrograms
    FROM public.product_nutrient pn
    INNER JOIN filtered_products p ON p.id = pn.product_id
    GROUP BY pn.product_id
  )
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
    p.energy_joules,
    p.created_at,
    p.updated_at,
    p.tags,
    count(*) OVER () AS total_count
  FROM filtered_products p
  LEFT JOIN ingredient_stats ON ingredient_stats.product_id = p.id
  LEFT JOIN nutrient_sort_values ON nutrient_sort_values.product_id = p.id
  ORDER BY
    CASE WHEN p_sort = 'top_rated'   THEN p.avg_overall                   END DESC NULLS LAST,
    CASE WHEN p_sort = 'most_rated'  THEN p.ratings_count::numeric         END DESC NULLS LAST,
    CASE WHEN p_sort = 'price_asc'   THEN p.min_price_euro_cents::numeric  END ASC  NULLS LAST,
    CASE WHEN p_sort = 'price_desc'  THEN p.min_price_euro_cents::numeric  END DESC NULLS LAST,
    CASE WHEN p_sort = 'few_ingredients' THEN ingredient_stats.ingredient_count::numeric END ASC NULLS LAST,
    CASE WHEN p_sort = 'calories_asc'  THEN p.energy_joules::numeric END ASC  NULLS LAST,
    CASE WHEN p_sort = 'calories_desc' THEN p.energy_joules::numeric END DESC NULLS LAST,
    CASE WHEN p_sort = 'fat_asc' THEN nutrient_sort_values.fat_amount_micrograms::numeric END ASC NULLS LAST,
    CASE WHEN p_sort = 'saturated_fat_asc' THEN nutrient_sort_values.saturated_fat_amount_micrograms::numeric END ASC NULLS LAST,
    CASE WHEN p_sort = 'sugar_asc' THEN nutrient_sort_values.sugar_amount_micrograms::numeric END ASC NULLS LAST,
    CASE WHEN p_sort = 'protein_desc' THEN nutrient_sort_values.protein_amount_micrograms::numeric END DESC NULLS LAST,
    CASE WHEN p_sort = 'fiber_desc' THEN nutrient_sort_values.fiber_amount_micrograms::numeric END DESC NULLS LAST,
    CASE WHEN p_sort = 'newest' OR p_sort IS NULL THEN extract(epoch FROM p.created_at) END DESC NULLS LAST
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_products TO anon, authenticated;
