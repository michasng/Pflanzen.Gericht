UPDATE public.product
SET brand = 'Unbekannt'
WHERE brand IS NULL OR trim(brand) = '';

ALTER TABLE public.product
  ALTER COLUMN brand SET NOT NULL,
  ADD CONSTRAINT product_brand_check CHECK (length(trim(brand)) >= 1);
