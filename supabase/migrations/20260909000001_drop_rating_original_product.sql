ALTER TABLE public.rating
  DROP CONSTRAINT IF EXISTS rating_original_product_not_self;

ALTER TABLE public.rating
  DROP CONSTRAINT IF EXISTS rating_original_product_id_fkey;

DROP INDEX IF EXISTS public.rating_original_product_id_idx;

ALTER TABLE public.rating
  DROP COLUMN IF EXISTS original_product_id;
