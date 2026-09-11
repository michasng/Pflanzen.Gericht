ALTER TABLE public.profile           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_image     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredient ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_nutrient  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_tag        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_image      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_report      ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "product_nutrients: publicly readable"
  ON public.product_nutrient FOR SELECT USING (true);

CREATE POLICY "product_nutrients: product owner add"
  ON public.product_nutrient FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "product_nutrients: product owner delete"
  ON public.product_nutrient FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "reviews: publicly readable"
  ON public.review FOR SELECT USING (true);

CREATE POLICY "reviews: create when authenticated"
  ON public.review FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews: edit own or admin"
  ON public.review FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "reviews: delete own or admin"
  ON public.review FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "review_tags: publicly readable"
  ON public.review_tag FOR SELECT USING (true);

CREATE POLICY "review_tags: review owner add"
  ON public.review_tag FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.review
      WHERE id = review_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "review_tags: review owner delete"
  ON public.review_tag FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.review
      WHERE id = review_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "review_images: publicly readable"
  ON public.review_image FOR SELECT USING (true);

CREATE POLICY "review_images: review owner add"
  ON public.review_image FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.review
      WHERE id = review_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "review_images: review owner delete"
  ON public.review_image FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.review
      WHERE id = review_id
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
  public.product_ingredient,
  public.product_nutrient,
  public.review,
  public.review_tag,
  public.review_image,
  public.price_report
TO anon, authenticated;

GRANT UPDATE ON public.profile TO authenticated;

GRANT INSERT, UPDATE, DELETE ON
  public.product,
  public.product_image
TO authenticated;

GRANT INSERT, DELETE ON
  public.product_ingredient,
  public.product_nutrient
TO authenticated;

GRANT INSERT, UPDATE, DELETE ON
  public.review,
  public.review_image
TO authenticated;

-- review_tag rows are inserted/deleted with their parent review, never updated
GRANT INSERT, DELETE ON public.review_tag TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.price_report TO authenticated;

GRANT EXECUTE ON FUNCTION public.search_products TO anon, authenticated;
