DROP POLICY IF EXISTS "product-images: delete own files" ON storage.objects;

-- Product deletion cleanup must remove blobs uploaded by other users; limiting delete to uploader-only leaves orphaned files.
CREATE POLICY "product-images: delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.product
        WHERE id::text = (storage.foldername(name))[2]
          AND (created_by = auth.uid() OR public.is_admin())
      )
    )
  );

DROP POLICY IF EXISTS "review-images: delete own files" ON storage.objects;

-- Product deletion cleanup must remove review blobs from other reviewers; uploader-only delete would block owner/admin product deletes.
CREATE POLICY "review-images: delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.review
        JOIN public.product ON public.product.id = public.review.product_id
        WHERE public.review.id::text = (storage.foldername(name))[2]
          AND (
            public.review.user_id = auth.uid()
            OR public.product.created_by = auth.uid()
            OR public.is_admin()
          )
      )
    )
  );
