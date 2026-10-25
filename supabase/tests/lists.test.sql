BEGIN;

SELECT plan(17);

INSERT INTO auth.users (id, email)
VALUES
  ('00000000-0000-0000-0000-000000000021', 'lists_owner@example.com'),
  ('00000000-0000-0000-0000-000000000022', 'lists_other@example.com'),
  ('00000000-0000-0000-0000-000000000023', 'lists_admin@example.com');

UPDATE public.profile SET is_admin = true WHERE id = '00000000-0000-0000-0000-000000000023';

INSERT INTO public.product (id, name, brand, category, created_by, quantity_value, quantity_unit)
VALUES
  ('00000000-0000-0000-0000-0000000000c1', 'List Product One', 'Testmarke', 'milk', '00000000-0000-0000-0000-000000000021', 1000, 'ml'),
  ('00000000-0000-0000-0000-0000000000c2', 'List Product Two', 'Testmarke', 'milk', '00000000-0000-0000-0000-000000000021', 1000, 'ml'),
  ('00000000-0000-0000-0000-0000000000c3', 'List Product Merged', 'Testmarke', 'milk', '00000000-0000-0000-0000-000000000021', 1000, 'ml');

INSERT INTO public.product_image (product_id, storage_path, sort_order)
VALUES
  ('00000000-0000-0000-0000-0000000000c1', 'one-second.jpg', 1),
  ('00000000-0000-0000-0000-0000000000c1', 'one-first.jpg', 0);

INSERT INTO public.list (id, owner_id, name, visibility)
VALUES
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000021', 'Favoriten', 'public'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-000000000021', 'Geheim', 'private'),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-000000000021', 'Beide', 'private');

INSERT INTO public.list_entry (list_id, product_id, added_at)
VALUES
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c2', '2026-01-01'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', '2026-02-01'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000c1', '2026-03-01'),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000c1', '2026-05-01'),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000c2', '2026-04-01');

-- visibility
SET LOCAL ROLE anon;
SELECT is((SELECT count(*) FROM public.list), 1::bigint, 'anon sees only the public list');
SELECT is((SELECT count(*) FROM public.list_entry), 2::bigint, 'anon sees only entries of public lists');
SELECT results_eq(
  $$SELECT product_count, cover_storage_path FROM public.list_summary$$,
  $$VALUES (2, 'one-first.jpg')$$,
  'the summary counts products and uses the cover of the most recently added product with an image'
);
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000021", "role": "authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*) FROM public.list), 3::bigint, 'the owner sees all of their lists');
SELECT is((SELECT count(*) FROM public.list_entry), 5::bigint, 'the owner sees all of their entries');

SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000022", "role": "authenticated"}', true);
SELECT is((SELECT count(*) FROM public.list), 1::bigint, 'another user sees only the public list');
SELECT is((SELECT count(*) FROM public.list_entry), 2::bigint, 'another user sees only entries of public lists');

SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000023", "role": "authenticated"}', true);
SELECT is((SELECT count(*) FROM public.list), 1::bigint, 'an admin sees only the public list');

-- writes by someone else
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000022", "role": "authenticated"}', true);
SELECT throws_ok(
  $$INSERT INTO public.list (owner_id, name, visibility) VALUES ('00000000-0000-0000-0000-000000000021', 'Fremd', 'public')$$,
  '42501',
  NULL,
  'a user cannot create a list for someone else'
);
SELECT throws_ok(
  $$INSERT INTO public.list_entry (list_id, product_id) VALUES ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c3')$$,
  '42501',
  NULL,
  'a user cannot add entries to a list they do not own'
);

-- owner writes
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000021", "role": "authenticated"}', true);
SELECT throws_ok(
  $$INSERT INTO public.list (owner_id, name, visibility) VALUES ('00000000-0000-0000-0000-000000000021', 'FAVORITEN', 'private')$$,
  '23505',
  NULL,
  'a list name must be unique per owner ignoring case'
);
SELECT throws_ok(
  $$INSERT INTO public.list (owner_id, name, visibility) VALUES ('00000000-0000-0000-0000-000000000021', ' Padded ', 'private')$$,
  '23514',
  NULL,
  'a list name must be trimmed'
);
SELECT throws_ok(
  $$INSERT INTO public.list_entry (list_id, product_id) VALUES ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1')$$,
  '23505',
  NULL,
  'a product appears on a list at most once'
);

-- merge
SELECT throws_ok(
  $$SELECT public.move_list_entries(ARRAY['00000000-0000-0000-0000-0000000000c1']::uuid[], '00000000-0000-0000-0000-0000000000c3')$$,
  '42501',
  NULL,
  'only admins can move list entries'
);

SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000023", "role": "authenticated"}', true);
SELECT public.move_list_entries(
  ARRAY['00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2']::uuid[],
  '00000000-0000-0000-0000-0000000000c3'
);

RESET ROLE;

SELECT is(
  (SELECT count(*) FROM public.list_entry WHERE product_id IN ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2')),
  0::bigint,
  'the merge leaves no entries on the duplicates'
);
SELECT results_eq(
  $$SELECT list_id::text, added_at::date::text FROM public.list_entry
    WHERE product_id = '00000000-0000-0000-0000-0000000000c3' ORDER BY list_id$$,
  $$VALUES
    ('00000000-0000-0000-0000-0000000000d1', '2026-01-01'),
    ('00000000-0000-0000-0000-0000000000d2', '2026-03-01'),
    ('00000000-0000-0000-0000-0000000000d3', '2026-04-01')$$,
  'the merge moves entries including private lists and keeps the earlier date when both are on a list'
);

-- cascades
DELETE FROM public.product WHERE id = '00000000-0000-0000-0000-0000000000c3';
DELETE FROM public.list WHERE id = '00000000-0000-0000-0000-0000000000d1';

SELECT is(
  (SELECT count(*) FROM public.list_entry),
  0::bigint,
  'deleting a product or a list deletes its entries'
);

SELECT * FROM finish();

ROLLBACK;
