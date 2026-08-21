-- Migration 4: Storage-Buckets und -Policies

-- ---------------------------------------------------------------------------
-- Buckets anlegen (public read, 5 MB Limit, nur Bildformate)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'product-images',
    'product-images',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'review-images',
    'review-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Pfad-Konvention: {user_id}/{produkt_oder_rating_id}/{dateiname}
-- Nutzer können nur unter ihrem eigenen Verzeichnis hochladen/löschen.
-- ---------------------------------------------------------------------------

-- product-images
CREATE POLICY "product-images: öffentlich lesbar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product-images: authentifiziert hochladen"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "product-images: eigene Dateien löschen"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- review-images
CREATE POLICY "review-images: öffentlich lesbar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-images');

CREATE POLICY "review-images: authentifiziert hochladen"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'review-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "review-images: eigene Dateien löschen"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
