ALTER TABLE public.product_ingredient
  ADD COLUMN sort_order smallint NOT NULL DEFAULT 0;
