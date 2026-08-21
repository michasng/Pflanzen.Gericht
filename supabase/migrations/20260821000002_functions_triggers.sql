CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_base text;
  v_username text;
  v_n integer := 0;
BEGIN
  -- derive base username from metadata or email prefix
  v_base := coalesce(
    nullif(trim(NEW.raw_user_meta_data->>'username'), ''),
    split_part(NEW.email, '@', 1)
  );
  -- strip disallowed characters and truncate
  v_base := left(regexp_replace(lower(v_base), '[^a-z0-9_]', '', 'g'), 25);
  IF length(v_base) < 3 THEN
    v_base := 'nutzer';
  END IF;

  v_username := v_base;

  -- ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_n := v_n + 1;
    v_username := v_base || v_n::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name)
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

CREATE OR REPLACE FUNCTION public.supersede_previous_rating()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.ratings
  SET    is_current = false
  WHERE  product_id = NEW.product_id
    AND  user_id    = NEW.user_id
    AND  is_current = true;
  RETURN NEW;
END;
$$;

-- Must run BEFORE INSERT so the unique index (one current per user) is not violated
CREATE TRIGGER ratings_supersede_previous
  BEFORE INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.supersede_previous_rating();

CREATE OR REPLACE FUNCTION public.update_product_aggregates()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_product_id uuid;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE public.products
  SET
    avg_overall   = (
      SELECT round(avg(overall)::numeric, 2)
      FROM   public.ratings
      WHERE  product_id = v_product_id AND is_current = true
    ),
    ratings_count = (
      SELECT count(*)
      FROM   public.ratings
      WHERE  product_id = v_product_id AND is_current = true
    ),
    avg_price     = (
      SELECT round(avg(price)::numeric, 2)
      FROM   public.ratings
      WHERE  product_id = v_product_id AND is_current = true AND price IS NOT NULL
    )
  WHERE id = v_product_id;

  RETURN NULL; -- AFTER trigger; return value is irrelevant
END;
$$;

CREATE TRIGGER ratings_update_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_product_aggregates();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;
