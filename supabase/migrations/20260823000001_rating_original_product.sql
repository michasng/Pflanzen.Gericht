ALTER TABLE public.rating
  ADD COLUMN original_product_id uuid REFERENCES public.product(id) ON DELETE SET NULL;

ALTER TABLE public.rating
  ADD CONSTRAINT rating_original_product_not_self
  CHECK (original_product_id IS NULL OR original_product_id <> product_id);

CREATE INDEX rating_original_product_id_idx ON public.rating (original_product_id);
