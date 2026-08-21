-- Seed-Daten für Pflanzen.Gericht
-- Kategorien, Basen und Tags werden nicht geseedet — sie sind als
-- CHECK-Constraints im Schema definiert und im Frontend lokalisiert.
-- Wird mit `supabase db reset` oder manuell ausgeführt.

-- ---------------------------------------------------------------------------
-- Backfill: Profile für bereits bestehende auth.users anlegen
-- (falls der Signup-Trigger beim ersten Nutzer noch nicht aktiv war)
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, username)
SELECT
  u.id,
  -- Nutze email-prefix, bereinige ihn und stelle Einzigartigkeit sicher
  left(regexp_replace(lower(split_part(u.email, '@', 1)), '[^a-z0-9_]', '', 'g'), 25)
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
