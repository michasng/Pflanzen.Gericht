CREATE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER product_updated_at
  BEFORE UPDATE ON public.product
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER rating_updated_at
  BEFORE UPDATE ON public.rating
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_base     text;
  v_username text;
  v_n        integer := 0;
BEGIN
  -- derive base username from metadata or email prefix
  v_base := coalesce(
    nullif(trim(NEW.raw_user_meta_data->>'username'), ''),
    split_part(NEW.email, '@', 1)
  );
  -- strip disallowed characters and truncate
  v_base := left(regexp_replace(lower(v_base), '[^a-z0-9_]', '', 'g'), 25);
  IF length(v_base) < 3 THEN
    v_base := 'user';
  END IF;

  v_username := v_base;

  WHILE EXISTS (SELECT 1 FROM public.profile WHERE username = v_username) LOOP
    v_n := v_n + 1;
    v_username := v_base || v_n::text;
  END LOOP;

  INSERT INTO public.profile (id, username, display_name)
  VALUES (
    NEW.id,
    v_username,
    nullif(trim(coalesce(NEW.raw_user_meta_data->>'display_name', '')), '')
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Must fire BEFORE INSERT so the unique index (one current per user) is not violated
CREATE FUNCTION public.supersede_previous_rating()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.rating
  SET    is_current = false
  WHERE  product_id = NEW.product_id
    AND  user_id    = NEW.user_id
    AND  is_current = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER rating_supersede_previous
  BEFORE INSERT ON public.rating
  FOR EACH ROW EXECUTE FUNCTION public.supersede_previous_rating();

CREATE FUNCTION public.update_product_aggregates()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_product_id uuid;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE public.product
  SET
    avg_overall   = (
      SELECT round(avg(overall)::numeric, 2)
      FROM   public.rating
      WHERE  product_id = v_product_id AND is_current = true
    ),
    ratings_count = (
      SELECT count(*)
      FROM   public.rating
      WHERE  product_id = v_product_id AND is_current = true
    )
  WHERE id = v_product_id;

  RETURN NULL; -- AFTER trigger; return value is irrelevant
END;
$$;

CREATE TRIGGER rating_update_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON public.rating
  FOR EACH ROW EXECUTE FUNCTION public.update_product_aggregates();

-- Promote the most recent superseded rating when the current one is deleted
CREATE FUNCTION public.restore_previous_rating()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.is_current THEN
    UPDATE public.rating
    SET    is_current = true
    WHERE  id = (
      SELECT id
      FROM   public.rating
      WHERE  product_id = OLD.product_id
        AND  user_id    = OLD.user_id
        AND  is_current = false
      ORDER  BY created_at DESC
      LIMIT  1
    );
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER rating_restore_previous
  AFTER DELETE ON public.rating
  FOR EACH ROW EXECUTE FUNCTION public.restore_previous_rating();

CREATE FUNCTION public.recompute_product_tags(p_product_id uuid)
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
CREATE FUNCTION public.handle_rating_tag_change()
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

-- Fires when is_current changes or the rating is deleted (tags from superseded ratings must be removed)
CREATE FUNCTION public.handle_rating_currency_change()
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

CREATE FUNCTION public.update_product_min_price()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_product_id uuid;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE public.product
  SET min_price_euro_cents = (
    SELECT min(effective_price_euro_cents)
    FROM   public.price_report
    WHERE  product_id = v_product_id
  )
  WHERE id = v_product_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER price_report_update_min_price
  AFTER INSERT OR UPDATE OR DELETE ON public.price_report
  FOR EACH ROW EXECUTE FUNCTION public.update_product_min_price();

CREATE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    (SELECT is_admin FROM public.profile WHERE id = auth.uid()),
    false
  )
$$;

-- Central search RPC; uses EXISTS subquery for store/city to avoid unbounded IN lists
CREATE FUNCTION public.search_products(
  p_search     text    DEFAULT '',
  p_category   text    DEFAULT NULL,
  p_base       text    DEFAULT NULL,
  p_min_rating numeric DEFAULT NULL,
  p_store      text    DEFAULT NULL,
  p_city       text    DEFAULT NULL,
  p_min_price  integer DEFAULT NULL,
  p_max_price  integer DEFAULT NULL,
  p_tags       text[]  DEFAULT NULL,
  p_sort       text    DEFAULT 'newest',
  p_limit      integer DEFAULT 20,
  p_offset     integer DEFAULT 0
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
