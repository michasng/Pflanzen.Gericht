-- Migration 3: Row Level Security

-- RLS auf allen Tabellen aktivieren
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_tags    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_images  ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles
-- INSERT: nur via Signup-Trigger (handle_new_user, SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE POLICY "profiles: öffentlich lesbar"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles: eigenes Profil bearbeiten"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
CREATE POLICY "products: öffentlich lesbar"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "products: eingeloggt anlegen"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "products: eigene oder Admin bearbeiten"
  ON public.products FOR UPDATE
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "products: eigene oder Admin löschen"
  ON public.products FOR DELETE
  USING (created_by = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
CREATE POLICY "product_images: öffentlich lesbar"
  ON public.product_images FOR SELECT USING (true);

CREATE POLICY "product_images: Produkteigentümer hinzufügen"
  ON public.product_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "product_images: Produkteigentümer löschen"
  ON public.product_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- ratings
-- ---------------------------------------------------------------------------
CREATE POLICY "ratings: öffentlich lesbar"
  ON public.ratings FOR SELECT USING (true);

CREATE POLICY "ratings: eingeloggt anlegen"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ratings: eigene oder Admin bearbeiten"
  ON public.ratings FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ratings: eigene oder Admin löschen"
  ON public.ratings FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- rating_tags
-- ---------------------------------------------------------------------------
CREATE POLICY "rating_tags: öffentlich lesbar"
  ON public.rating_tags FOR SELECT USING (true);

CREATE POLICY "rating_tags: Bewertungseigentümer hinzufügen"
  ON public.rating_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ratings
      WHERE id = rating_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "rating_tags: Bewertungseigentümer löschen"
  ON public.rating_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ratings
      WHERE id = rating_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- rating_images
-- ---------------------------------------------------------------------------
CREATE POLICY "rating_images: öffentlich lesbar"
  ON public.rating_images FOR SELECT USING (true);

CREATE POLICY "rating_images: Bewertungseigentümer hinzufügen"
  ON public.rating_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ratings
      WHERE id = rating_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "rating_images: Bewertungseigentümer löschen"
  ON public.rating_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ratings
      WHERE id = rating_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );
