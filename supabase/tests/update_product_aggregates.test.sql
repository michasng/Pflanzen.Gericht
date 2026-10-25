BEGIN;

SELECT plan(4);

INSERT INTO auth.users (id, email)
VALUES
  ('00000000-0000-0000-0000-000000000011', 'aggregates_owner@example.com'),
  ('00000000-0000-0000-0000-000000000012', 'aggregates_reviewer@example.com');

INSERT INTO public.product (id, name, brand, category, created_by, quantity_value, quantity_unit)
VALUES (
  '00000000-0000-0000-0000-0000000000a1',
  'Aggregate Test Product',
  'Testmarke',
  'milk',
  '00000000-0000-0000-0000-000000000011',
  1000,
  'ml'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000012", "role": "authenticated"}', true);

INSERT INTO public.review (id, product_id, user_id, overall)
VALUES (
  '00000000-0000-0000-0000-0000000000b1',
  '00000000-0000-0000-0000-0000000000a1',
  '00000000-0000-0000-0000-000000000012',
  4
);

INSERT INTO public.review_tag (review_id, tag)
VALUES ('00000000-0000-0000-0000-0000000000b1', 'creamy');

INSERT INTO public.price_report (product_id, user_id, store, price_euro_cents)
VALUES ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000012', 'Testladen', 199);

RESET ROLE;

SELECT is(
  (SELECT reviews_count FROM public.product WHERE id = '00000000-0000-0000-0000-0000000000a1'),
  1,
  'given a review by someone other than the owner, it counts the review'
);

SELECT is(
  (SELECT avg_overall FROM public.product WHERE id = '00000000-0000-0000-0000-0000000000a1'),
  4.00::numeric,
  'given a review by someone other than the owner, it updates the average score'
);

SELECT is(
  (SELECT tags FROM public.product WHERE id = '00000000-0000-0000-0000-0000000000a1'),
  ARRAY['creamy'],
  'given a review tag by someone other than the owner, it updates the product tags'
);

SELECT is(
  (SELECT min_price_euro_cents FROM public.product WHERE id = '00000000-0000-0000-0000-0000000000a1'),
  199,
  'given a price report by someone other than the owner, it updates the lowest price'
);

SELECT * FROM finish();

ROLLBACK;
