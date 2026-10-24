DROP FUNCTION public.fetch_similar_products(uuid);

ALTER TABLE public.review DROP COLUMN nutrition;

CREATE FUNCTION public.fetch_similar_products(p_product_id uuid)
RETURNS TABLE (
  id             uuid,
  name           text,
  brand          text,
  category       text,
  base           text,
  is_organic     boolean,
  allergens      text[],
  avg_overall    numeric,
  avg_taste      numeric,
  avg_consistency numeric,
  avg_appearance numeric,
  avg_value      numeric,
  reviews_count  integer,
  storage_path   text,
  agree_count    bigint,
  total_count    bigint,
  agreement_rate numeric,
  my_vote        boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH product_pairs AS (
    SELECT
      CASE
        WHEN psv.product_id_a = p_product_id THEN psv.product_id_b
        ELSE psv.product_id_a
      END AS similar_product_id,
      psv.agreed,
      psv.user_id,
      psv.created_at
    FROM public.product_similarity_vote psv
    WHERE psv.product_id_a = p_product_id OR psv.product_id_b = p_product_id
  ),
  pair_totals AS (
    SELECT
      similar_product_id,
      count(*) FILTER (WHERE agreed = true) AS agree_count,
      count(*) AS total_count,
      min(created_at) AS first_created_at
    FROM product_pairs
    GROUP BY similar_product_id
  )
  SELECT
    p.id,
    p.name,
    p.brand,
    p.category,
    p.base,
    p.is_organic,
    p.allergens,
    p.avg_overall,
    review_averages.avg_taste,
    review_averages.avg_consistency,
    review_averages.avg_appearance,
    review_averages.avg_value,
    p.reviews_count,
    (
      SELECT pi.storage_path
      FROM public.product_image pi
      WHERE pi.product_id = p.id
      ORDER BY pi.sort_order, pi.created_at, pi.id
      LIMIT 1
    ) AS storage_path,
    pair_totals.agree_count,
    pair_totals.total_count,
    CASE
      WHEN pair_totals.total_count = 0 THEN 0
      ELSE pair_totals.agree_count::numeric / pair_totals.total_count::numeric
    END AS agreement_rate,
    (
      SELECT psv.agreed
      FROM public.product_similarity_vote psv
      WHERE (
        (psv.product_id_a = p_product_id AND psv.product_id_b = p.id)
        OR (psv.product_id_a = p.id AND psv.product_id_b = p_product_id)
      )
        AND psv.user_id = auth.uid()
      LIMIT 1
    ) AS my_vote
  FROM pair_totals
  JOIN public.product p ON p.id = pair_totals.similar_product_id
  LEFT JOIN LATERAL (
    SELECT
      avg(r.taste) AS avg_taste,
      avg(r.consistency) AS avg_consistency,
      avg(r.appearance) AS avg_appearance,
      avg(r.value) AS avg_value
    FROM public.review r
    WHERE r.product_id = p.id AND r.is_current = true
  ) AS review_averages ON true
  ORDER BY agreement_rate DESC, pair_totals.total_count DESC, pair_totals.first_created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_similar_products TO anon, authenticated;
