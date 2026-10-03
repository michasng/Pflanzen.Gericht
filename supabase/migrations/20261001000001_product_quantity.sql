ALTER TABLE public.product
  ADD COLUMN quantity_unit text NOT NULL DEFAULT 'piece'
    CONSTRAINT product_quantity_unit_check CHECK (quantity_unit IN ('ml', 'g', 'piece')),
  ADD COLUMN quantity_value integer NOT NULL DEFAULT 1
    CONSTRAINT product_quantity_value_check CHECK (quantity_value > 0);

ALTER TABLE public.product
  ALTER COLUMN quantity_unit DROP DEFAULT,
  ALTER COLUMN quantity_value DROP DEFAULT;
