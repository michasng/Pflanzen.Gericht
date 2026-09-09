CREATE TABLE public.product_similarity_vote (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id_a uuid        NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  product_id_b uuid        NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES public.profile(id),
  agreed       boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (product_id_a <> product_id_b),
  CHECK (product_id_a < product_id_b),
  UNIQUE (product_id_a, product_id_b, user_id)
);

CREATE INDEX product_similarity_vote_product_id_a_idx
  ON public.product_similarity_vote (product_id_a);
CREATE INDEX product_similarity_vote_product_id_b_idx
  ON public.product_similarity_vote (product_id_b);

CREATE TRIGGER product_similarity_vote_updated_at
  BEFORE UPDATE ON public.product_similarity_vote
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE FUNCTION public.product_similarity_cleanup_pair()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_product_id_a uuid;
  v_product_id_b uuid;
BEGIN
  v_product_id_a := COALESCE(NEW.product_id_a, OLD.product_id_a);
  v_product_id_b := COALESCE(NEW.product_id_b, OLD.product_id_b);

  IF EXISTS (
    SELECT 1
    FROM public.product_similarity_vote psv
    WHERE psv.product_id_a = v_product_id_a
      AND psv.product_id_b = v_product_id_b
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.product_similarity_vote psv
    WHERE psv.product_id_a = v_product_id_a
      AND psv.product_id_b = v_product_id_b
      AND psv.agreed = true
  ) THEN
    DELETE FROM public.product_similarity_vote
    WHERE product_id_a = v_product_id_a
      AND product_id_b = v_product_id_b;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER product_similarity_vote_cleanup_pair
  AFTER INSERT OR UPDATE OR DELETE ON public.product_similarity_vote
  FOR EACH ROW EXECUTE FUNCTION public.product_similarity_cleanup_pair();

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
  ratings_count  integer,
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
    p.ratings_count,
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
  ORDER BY agreement_rate DESC, pair_totals.total_count DESC, pair_totals.first_created_at ASC;
$$;

CREATE FUNCTION public.search_similarity_candidates(
  p_product_id uuid,
  p_search text
)
RETURNS TABLE (
  id           uuid,
  name         text,
  brand        text,
  category     text,
  storage_path text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.brand,
    p.category,
    (
      SELECT pi.storage_path
      FROM public.product_image pi
      WHERE pi.product_id = p.id
      ORDER BY pi.sort_order, pi.created_at, pi.id
      LIMIT 1
    ) AS storage_path
  FROM public.product p
  WHERE p.id <> p_product_id
    AND p.category = (
      SELECT current_product.category
      FROM public.product current_product
      WHERE current_product.id = p_product_id
    )
    AND (p_search IS NULL OR trim(p_search) = '' OR p.normalized_name ILIKE '%' || lower(trim(p_search)) || '%')
  ORDER BY p.name
  LIMIT 8;
$$;

ALTER TABLE public.product_similarity_vote ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_similarity_votes: publicly readable"
  ON public.product_similarity_vote FOR SELECT USING (true);

CREATE POLICY "product_similarity_votes: create when authenticated"
  ON public.product_similarity_vote FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "product_similarity_votes: edit own or admin"
  ON public.product_similarity_vote FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "product_similarity_votes: delete own or admin"
  ON public.product_similarity_vote FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

GRANT SELECT ON public.product_similarity_vote TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_similarity_vote TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_similar_products TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_similarity_candidates TO anon, authenticated;
