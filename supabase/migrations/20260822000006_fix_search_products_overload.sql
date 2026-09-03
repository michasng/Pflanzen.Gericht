-- The ingredients migration used CREATE OR REPLACE with two extra params,
-- which created a second overload instead of replacing the original
-- function. Postgres can't pick between the two when both extra params are
-- omitted, causing "Could not choose the best candidate function" errors.
-- Drop the old 12-arg overload so only the 14-arg version remains.
DROP FUNCTION IF EXISTS public.search_products(
  text, text, text, numeric, text, text, integer, integer, text[], text, integer, integer
);

GRANT EXECUTE ON FUNCTION public.search_products TO anon, authenticated;
