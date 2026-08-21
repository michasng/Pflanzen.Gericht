-- Categories, bases and tags are not seeded; they are defined as CHECK constraints
-- in the schema and localized in the frontend.

-- Backfill: create profiles for pre-existing auth.users
-- (in case the signup trigger was not active when the first user registered)
INSERT INTO public.profile (id, username)
SELECT
  u.id,
  left(regexp_replace(lower(split_part(u.email, '@', 1)), '[^a-z0-9_]', '', 'g'), 25)
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profile p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
