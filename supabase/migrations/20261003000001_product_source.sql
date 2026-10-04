CREATE TABLE public.product_source (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid        NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  url        text        NOT NULL CHECK (url ~* '^https?://[^\s%/?#]+([/?#]\S*)?$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_source_product_id_idx ON public.product_source (product_id);
CREATE UNIQUE INDEX product_source_dedupe_idx ON public.product_source (product_id, url);

ALTER TABLE public.product_source ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_sources: publicly readable"
  ON public.product_source FOR SELECT USING (true);

CREATE POLICY "product_sources: product owner add"
  ON public.product_source FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "product_sources: product owner delete"
  ON public.product_source FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.product
      WHERE id = product_id
        AND (created_by = auth.uid() OR public.is_admin())
    )
  );

GRANT SELECT ON public.product_source TO anon, authenticated;
GRANT INSERT, DELETE ON public.product_source TO authenticated;
