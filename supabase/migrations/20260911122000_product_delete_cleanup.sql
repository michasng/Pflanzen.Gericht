CREATE TABLE public.pending_product_deletion (
  product_id  uuid        PRIMARY KEY REFERENCES public.product(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_product_deletion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pending_product_deletions: authenticated read"
  ON public.pending_product_deletion FOR SELECT
  USING (true);

CREATE POLICY "pending_product_deletions: product owner add"
  ON public.pending_product_deletion FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "pending_product_deletions: product owner delete"
  ON public.pending_product_deletion FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

GRANT SELECT, INSERT, DELETE ON public.pending_product_deletion TO authenticated;

DROP POLICY "product_images: product owner add" ON public.product_image;
CREATE POLICY "product_images: product owner add"
  ON public.product_image FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (storage.foldername(storage_path))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
        AND NOT EXISTS (
          SELECT 1
          FROM public.pending_product_deletion
          WHERE pending_product_deletion.product_id = public.product.id
        )
    )
  );

DROP POLICY "product_images: product owner delete" ON public.product_image;
CREATE POLICY "product_images: product owner delete"
  ON public.product_image FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
        AND NOT EXISTS (
          SELECT 1
          FROM public.pending_product_deletion
          WHERE pending_product_deletion.product_id = public.product.id
        )
    )
  );

DROP POLICY "reviews: create when authenticated" ON public.review;
CREATE POLICY "reviews: create when authenticated"
  ON public.review FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND NOT EXISTS (
          SELECT 1
          FROM public.pending_product_deletion
          WHERE pending_product_deletion.product_id = public.product.id
        )
    )
  );

DROP POLICY "reviews: edit own or admin" ON public.review;
CREATE POLICY "reviews: edit own or admin"
  ON public.review FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (
    (user_id = auth.uid() OR public.is_admin())
    AND EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND NOT EXISTS (
          SELECT 1
          FROM public.pending_product_deletion
          WHERE pending_product_deletion.product_id = public.product.id
        )
    )
  );

DROP POLICY "review_images: review owner add" ON public.review_image;
CREATE POLICY "review_images: review owner add"
  ON public.review_image FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (storage.foldername(storage_path))[1] = auth.uid()::text
    AND
    EXISTS (
      SELECT 1
      FROM public.review AS r
      JOIN public.product AS p ON p.id = r.product_id
      WHERE r.id = review_id
        AND (r.user_id = auth.uid() OR public.is_admin())
        AND NOT EXISTS (
          SELECT 1
          FROM public.pending_product_deletion
          WHERE pending_product_deletion.product_id = p.id
        )
    )
  );

DROP POLICY "review_images: review owner delete" ON public.review_image;
CREATE POLICY "review_images: review owner delete"
  ON public.review_image FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.review AS r
      JOIN public.product AS p ON p.id = r.product_id
      WHERE r.id = review_id
        AND (r.user_id = auth.uid() OR public.is_admin())
        AND NOT EXISTS (
          SELECT 1
          FROM public.pending_product_deletion
          WHERE pending_product_deletion.product_id = p.id
        )
    )
  );

CREATE POLICY "product-images: delete product image variants"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1
      FROM public.product_image AS pi
      JOIN public.product AS p ON p.id = pi.product_id
      JOIN public.pending_product_deletion AS ppd ON ppd.product_id = p.id
      WHERE (name = pi.storage_path OR name LIKE pi.storage_path || '/%')
        AND (p.created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "review-images: delete authorized image variants"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-images'
    AND EXISTS (
      SELECT 1
      FROM public.review_image AS ri
      JOIN public.review AS r ON r.id = ri.review_id
      JOIN public.product AS p ON p.id = r.product_id
      JOIN public.pending_product_deletion AS ppd ON ppd.product_id = p.id
      WHERE (name = ri.storage_path OR name LIKE ri.storage_path || '/%')
        AND (p.created_by = auth.uid() OR public.is_admin())
    )
  );
