ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_tags    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_images  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: publicly readable"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles: edit own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "products: publicly readable"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "products: create when authenticated"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "products: edit own or admin"
  ON public.products FOR UPDATE
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "products: delete own or admin"
  ON public.products FOR DELETE
  USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "product_images: publicly readable"
  ON public.product_images FOR SELECT USING (true);

CREATE POLICY "product_images: product owner add"
  ON public.product_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "product_images: product owner delete"
  ON public.product_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "ratings: publicly readable"
  ON public.ratings FOR SELECT USING (true);

CREATE POLICY "ratings: create when authenticated"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ratings: edit own or admin"
  ON public.ratings FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ratings: delete own or admin"
  ON public.ratings FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "rating_tags: publicly readable"
  ON public.rating_tags FOR SELECT USING (true);

CREATE POLICY "rating_tags: rating owner add"
  ON public.rating_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ratings
      WHERE id = rating_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "rating_tags: rating owner delete"
  ON public.rating_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ratings
      WHERE id = rating_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "rating_images: publicly readable"
  ON public.rating_images FOR SELECT USING (true);

CREATE POLICY "rating_images: rating owner add"
  ON public.rating_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ratings
      WHERE id = rating_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "rating_images: rating owner delete"
  ON public.rating_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ratings
      WHERE id = rating_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );
