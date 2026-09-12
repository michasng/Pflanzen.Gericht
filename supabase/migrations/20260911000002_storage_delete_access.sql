DROP POLICY IF EXISTS "product-images: delete own files" ON storage.objects;
DROP POLICY IF EXISTS "product-images: uploader delete own files" ON storage.objects;
DROP POLICY IF EXISTS "product-images: product owner or admin cleanup" ON storage.objects;

CREATE POLICY "product-images: uploader delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Product image cleanup must also work when a product owner or admin removes blobs uploaded under another user's folder.
CREATE POLICY "product-images: product owner or admin cleanup"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.product
      WHERE id::text = (storage.foldername(name))[2]
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "review-images: delete own files" ON storage.objects;
DROP POLICY IF EXISTS "review-images: uploader delete own files" ON storage.objects;
DROP POLICY IF EXISTS "review-images: review owner or admin delete" ON storage.objects;
DROP POLICY IF EXISTS "review-images: product owner cleanup" ON storage.objects;

CREATE POLICY "review-images: uploader delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Review deletion removes storage before the review row, so review owners and admins need direct blob delete access beyond uploader-only cleanup.
CREATE POLICY "review-images: review owner or admin delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-images'
    AND EXISTS (
      SELECT 1
      FROM public.review
      WHERE public.review.id::text = (storage.foldername(name))[2]
        AND (public.review.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Limitation: Storage RLS cannot distinguish product deletion cleanup from direct review-image deletion, so product owners can also remove review-image blobs outside product deletion for now.
CREATE POLICY "review-images: product owner cleanup"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-images'
    AND EXISTS (
      SELECT 1
      FROM public.review
      JOIN public.product ON public.product.id = public.review.product_id
      WHERE public.review.id::text = (storage.foldername(name))[2]
        AND public.product.created_by = auth.uid()
    )
  );
