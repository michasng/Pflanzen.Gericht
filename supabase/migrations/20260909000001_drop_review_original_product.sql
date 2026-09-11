ALTER TABLE public.review
  DROP CONSTRAINT IF EXISTS review_original_product_not_self;

ALTER TABLE public.review
  DROP CONSTRAINT IF EXISTS review_original_product_id_fkey;

DROP INDEX IF EXISTS public.review_original_product_id_idx;

ALTER TABLE public.review
  DROP COLUMN IF EXISTS original_product_id;
