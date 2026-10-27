BEGIN;

SELECT plan(14);

INSERT INTO auth.users (id, email)
VALUES
  ('00000000-0000-0000-0000-000000000031', 'reaction_author@example.com'),
  ('00000000-0000-0000-0000-000000000032', 'reaction_reactor@example.com'),
  ('00000000-0000-0000-0000-000000000033', 'reaction_other@example.com'),
  ('00000000-0000-0000-0000-000000000034', 'reaction_admin@example.com');

UPDATE public.profile SET is_admin = true WHERE id = '00000000-0000-0000-0000-000000000034';

INSERT INTO public.product (id, name, brand, category, created_by, quantity_value, quantity_unit)
VALUES ('00000000-0000-0000-0000-0000000000e1', 'Reaction Product', 'Testmarke', 'milk', '00000000-0000-0000-0000-000000000031', 1000, 'ml');

INSERT INTO public.review (id, product_id, user_id, overall)
VALUES ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000031', 4);

INSERT INTO public.review_reaction (review_id, user_id, emoji)
VALUES ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000033', '👍');

-- reading
SET LOCAL ROLE anon;
SELECT is((SELECT count(*) FROM public.review_reaction), 1::bigint, 'anon can read reactions');
SELECT throws_ok(
  $$INSERT INTO public.review_reaction (review_id, user_id, emoji) VALUES ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000032', '👍')$$,
  '42501',
  NULL,
  'anon cannot react'
);

-- own reactions
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000032", "role": "authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*) FROM public.review_reaction), 1::bigint, 'another user can read reactions');
SELECT lives_ok(
  $$INSERT INTO public.review_reaction (review_id, user_id, emoji) VALUES ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000032', '👍')$$,
  'a user can react as themselves'
);
SELECT lives_ok(
  $$INSERT INTO public.review_reaction (review_id, user_id, emoji) VALUES ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000032', '🎉')$$,
  'a user can use several emojis on one review'
);
SELECT throws_ok(
  $$INSERT INTO public.review_reaction (review_id, user_id, emoji) VALUES ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000032', '👍')$$,
  '23505',
  NULL,
  'a user cannot use the same emoji twice on one review'
);
SELECT throws_ok(
  $$INSERT INTO public.review_reaction (review_id, user_id, emoji) VALUES ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000033', '😂')$$,
  '42501',
  NULL,
  'a user cannot react on behalf of someone else'
);
SELECT throws_ok(
  $$INSERT INTO public.review_reaction (review_id, user_id, emoji) VALUES ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000032', '')$$,
  '23514',
  NULL,
  'an empty emoji is rejected'
);
SELECT throws_ok(
  format($$INSERT INTO public.review_reaction (review_id, user_id, emoji) VALUES ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000032', %L)$$, repeat('a', 33)),
  '23514',
  NULL,
  'an emoji longer than 32 characters is rejected'
);

-- deleting
DELETE FROM public.review_reaction WHERE user_id = '00000000-0000-0000-0000-000000000033';
SELECT is(
  (SELECT count(*) FROM public.review_reaction WHERE user_id = '00000000-0000-0000-0000-000000000033'),
  1::bigint,
  'a user cannot delete the reactions of someone else'
);
SELECT lives_ok(
  $$DELETE FROM public.review_reaction WHERE user_id = '00000000-0000-0000-0000-000000000032' AND emoji = '🎉'$$,
  'a user can delete their own reaction'
);

-- merge
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000034", "role": "authenticated"}', true);
SELECT lives_ok(
  $$INSERT INTO public.review_reaction (review_id, user_id, emoji, created_at) VALUES ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000033', '🔥', '2026-02-02')$$,
  'an admin can create reactions on behalf of others'
);

-- cascades
RESET ROLE;
DELETE FROM public.review WHERE id = '00000000-0000-0000-0000-0000000000f1';
SELECT is(
  (SELECT count(*) FROM public.review_reaction),
  0::bigint,
  'deleting a review deletes its reactions'
);

INSERT INTO public.review (id, product_id, user_id, overall)
VALUES ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000031', 4);
INSERT INTO public.review_reaction (review_id, user_id, emoji)
VALUES ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000033', '👍');
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000033';
SELECT is(
  (SELECT count(*) FROM public.review_reaction),
  0::bigint,
  'deleting a user deletes their reactions'
);

SELECT * FROM finish();

ROLLBACK;
