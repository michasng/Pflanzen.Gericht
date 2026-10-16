BEGIN;

SELECT plan(6);

INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'search_products_test@example.com');

INSERT INTO public.product (name, brand, category, created_by, quantity_value, quantity_unit)
VALUES
  ('Haferdrink Barista Edition', 'Oatly', 'milk', '00000000-0000-0000-0000-000000000001', 1000, 'ml'),
  ('Sojajoghurt Natur', 'Alpro', 'yogurt', '00000000-0000-0000-0000-000000000001', 500, 'g');

-- Scopes results to this test's fixtures, ignoring any other products in the database
CREATE FUNCTION pg_temp.search_fixture_names(p_search text)
RETURNS SETOF text
LANGUAGE sql
AS $$
  SELECT name
  FROM public.search_products(p_search => p_search, p_limit => 1000)
  WHERE created_by = '00000000-0000-0000-0000-000000000001';
$$;

SELECT set_eq(
  $$ SELECT pg_temp.search_fixture_names('') $$,
  ARRAY['Haferdrink Barista Edition', 'Sojajoghurt Natur'],
  'given an empty search, it finds all products'
);

SELECT set_eq(
  $$ SELECT pg_temp.search_fixture_names('Oatly haferdrink') $$,
  ARRAY['Haferdrink Barista Edition'],
  'given brand and name words, it finds the product regardless of casing'
);

SELECT set_eq(
  $$ SELECT pg_temp.search_fixture_names('hafer barista Oatly') $$,
  ARRAY['Haferdrink Barista Edition'],
  'given words in a different order, it finds the product'
);

SELECT set_eq(
  $$ SELECT pg_temp.search_fixture_names('oat drink') $$,
  ARRAY['Haferdrink Barista Edition'],
  'given partial words, it finds the product'
);

SELECT set_eq(
  $$ SELECT pg_temp.search_fixture_names('  OAT   Drink ') $$,
  ARRAY['Haferdrink Barista Edition'],
  'given surrounding and repeated whitespace, it finds the product'
);

SELECT is_empty(
  $$ SELECT pg_temp.search_fixture_names('oat milk') $$,
  'given a word matching neither name nor brand, it finds nothing'
);

SELECT * FROM finish();

ROLLBACK;
