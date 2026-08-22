ALTER TABLE public.profile       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_image ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_tag    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_image  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_report  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: publicly readable"
  ON public.profile FOR SELECT
  USING (true);

CREATE POLICY "profiles: edit own"
  ON public.profile FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "products: publicly readable"
  ON public.product FOR SELECT USING (true);

CREATE POLICY "products: create when authenticated"
  ON public.product FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "products: edit own or admin"
  ON public.product FOR UPDATE
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "products: delete own or admin"
  ON public.product FOR DELETE
  USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "product_images: publicly readable"
  ON public.product_image FOR SELECT USING (true);

CREATE POLICY "product_images: product owner add"
  ON public.product_image FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "product_images: product owner delete"
  ON public.product_image FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "ratings: publicly readable"
  ON public.rating FOR SELECT USING (true);

CREATE POLICY "ratings: create when authenticated"
  ON public.rating FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ratings: edit own or admin"
  ON public.rating FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ratings: delete own or admin"
  ON public.rating FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "rating_tags: publicly readable"
  ON public.rating_tag FOR SELECT USING (true);

CREATE POLICY "rating_tags: rating owner add"
  ON public.rating_tag FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rating
      WHERE id = rating_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "rating_tags: rating owner delete"
  ON public.rating_tag FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.rating
      WHERE id = rating_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "rating_images: publicly readable"
  ON public.rating_image FOR SELECT USING (true);

CREATE POLICY "rating_images: rating owner add"
  ON public.rating_image FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rating
      WHERE id = rating_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "rating_images: rating owner delete"
  ON public.rating_image FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.rating
      WHERE id = rating_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "price_reports: publicly readable"
  ON public.price_report FOR SELECT USING (true);

CREATE POLICY "price_reports: create when authenticated"
  ON public.price_report FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "price_reports: edit own or admin"
  ON public.price_report FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "price_reports: delete own or admin"
  ON public.price_report FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON
  public.profile,
  public.product,
  public.product_image,
  public.rating,
  public.rating_tag,
  public.rating_image,
  public.price_report
TO anon, authenticated;

GRANT UPDATE ON public.profile TO authenticated;

GRANT INSERT, UPDATE, DELETE ON
  public.product,
  public.product_image
TO authenticated;

GRANT INSERT, UPDATE, DELETE ON
  public.rating,
  public.rating_image
TO authenticated;

-- rating_tag rows are inserted/deleted with their parent rating, never updated
GRANT INSERT, DELETE ON public.rating_tag TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.price_report TO authenticated;

GRANT EXECUTE ON FUNCTION public.search_products TO anon, authenticated;
