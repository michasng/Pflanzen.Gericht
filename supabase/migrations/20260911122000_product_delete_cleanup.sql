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
    )
  );

DROP POLICY "review_images: review owner add" ON public.review_image;
CREATE POLICY "review_images: review owner add"
  ON public.review_image FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (storage.foldername(storage_path))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.review
      WHERE id = review_id
        AND (user_id = auth.uid() OR public.is_admin())
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
      WHERE (name = ri.storage_path OR name LIKE ri.storage_path || '/%')
        AND (p.created_by = auth.uid() OR public.is_admin())
    )
  );
