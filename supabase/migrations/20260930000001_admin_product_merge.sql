-- Merging products copies rows and blobs that belong to other users, so admins need insert access beyond their own user id.
CREATE POLICY "reviews: admin create for merge"
  ON public.review FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "price_reports: admin create for merge"
  ON public.price_report FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "product_similarity_votes: admin create for merge"
  ON public.product_similarity_vote FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "product-images: admin upload for merge"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "review-images: admin upload for merge"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'review-images' AND public.is_admin());
