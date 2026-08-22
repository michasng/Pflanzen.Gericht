-- Denormalize the distinct set of tags from current ratings onto product for filtering
ALTER TABLE public.product
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX product_tags_gin_idx ON public.product USING gin (tags);

CREATE OR REPLACE FUNCTION public.recompute_product_tags(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.product
  SET tags = (
    SELECT coalesce(array_agg(DISTINCT rt.tag ORDER BY rt.tag), '{}')
    FROM   public.rating_tag rt
    JOIN   public.rating r ON r.id = rt.rating_id
    WHERE  r.product_id = p_product_id
      AND  r.is_current = true
  )
  WHERE id = p_product_id;
END;
$$;

-- Fires when a tag row is inserted or deleted on a current rating
CREATE OR REPLACE FUNCTION public.handle_rating_tag_change()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_product_id uuid;
BEGIN
  SELECT product_id INTO v_product_id
  FROM   public.rating
  WHERE  id = COALESCE(NEW.rating_id, OLD.rating_id);

  IF v_product_id IS NOT NULL THEN
    PERFORM public.recompute_product_tags(v_product_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER rating_tag_sync_product_tags
  AFTER INSERT OR DELETE ON public.rating_tag
  FOR EACH ROW EXECUTE FUNCTION public.handle_rating_tag_change();

-- Fires when a rating's is_current flag changes or the rating is deleted
-- (tags from superseded ratings must be removed from the denormalized set)
CREATE OR REPLACE FUNCTION public.handle_rating_currency_change()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.recompute_product_tags(COALESCE(NEW.product_id, OLD.product_id));
  RETURN NULL;
END;
$$;

CREATE TRIGGER rating_currency_sync_product_tags
  AFTER UPDATE OF is_current OR DELETE ON public.rating
  FOR EACH ROW EXECUTE FUNCTION public.handle_rating_currency_change();

-- Backfill existing products
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.product LOOP
    PERFORM public.recompute_product_tags(r.id);
  END LOOP;
END;
$$;

-- Central search RPC used by the frontend instead of building PostgREST queries client-side.
-- Returns matched product rows plus a total_count window column for result feedback.
-- store/city filtering is done with a server-side EXISTS subquery (no unbounded IN list).
CREATE OR REPLACE FUNCTION public.search_products(
  p_search        text        DEFAULT '',
  p_category      text        DEFAULT NULL,
  p_base          text        DEFAULT NULL,
  p_min_rating    numeric     DEFAULT NULL,
  p_store         text        DEFAULT NULL,
  p_city          text        DEFAULT NULL,
  p_min_price     integer     DEFAULT NULL,
  p_max_price     integer     DEFAULT NULL,
  p_tags          text[]      DEFAULT NULL,
  p_sort          text        DEFAULT 'newest',
  p_limit         integer     DEFAULT 20,
  p_offset        integer     DEFAULT 0
)
RETURNS TABLE (
  id                    uuid,
  name                  text,
  brand                 text,
  description           text,
  category              text,
  base                  text,
  created_by            uuid,
  normalized_name       text,
  avg_overall           numeric,
  ratings_count         integer,
  min_price_euro_cents  integer,
  created_at            timestamptz,
  updated_at            timestamptz,
  tags                  text[],
  total_count           bigint
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
    (p_search  IS NULL OR p_search = '' OR p.normalized_name ILIKE '%' || lower(trim(p_search)) || '%')
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_base     IS NULL OR p.base     = p_base)
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
  ORDER BY
    CASE WHEN p_sort = 'top_rated'   THEN p.avg_overall               END DESC NULLS LAST,
    CASE WHEN p_sort = 'most_rated'  THEN p.ratings_count::numeric     END DESC NULLS LAST,
    CASE WHEN p_sort = 'price_asc'   THEN p.min_price_euro_cents::numeric END ASC  NULLS LAST,
    CASE WHEN p_sort = 'price_desc'  THEN p.min_price_euro_cents::numeric END DESC NULLS LAST,
    CASE WHEN p_sort = 'newest' OR p_sort IS NULL THEN extract(epoch FROM p.created_at) END DESC NULLS LAST
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_products TO anon, authenticated;
