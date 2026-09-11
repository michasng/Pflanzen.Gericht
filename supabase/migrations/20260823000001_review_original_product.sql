ALTER TABLE public.review
  ADD COLUMN original_product_id uuid REFERENCES public.product(id) ON DELETE SET NULL;

ALTER TABLE public.review
  ADD CONSTRAINT review_original_product_not_self
  CHECK (original_product_id IS NULL OR original_product_id <> product_id);

CREATE INDEX review_original_product_id_idx ON public.review (original_product_id);
