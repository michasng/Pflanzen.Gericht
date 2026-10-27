CREATE TABLE public.review_reaction (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  uuid        NOT NULL REFERENCES public.review(id)  ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  emoji      text        NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, user_id, emoji)
);

CREATE INDEX review_reaction_user_id_idx ON public.review_reaction (user_id);

ALTER TABLE public.review_reaction ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_reactions: readable by everyone"
  ON public.review_reaction FOR SELECT
  USING (true);

CREATE POLICY "review_reactions: create own"
  ON public.review_reaction FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "review_reactions: delete own"
  ON public.review_reaction FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "review_reactions: admin create for merge"
  ON public.review_reaction FOR INSERT
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.review_reaction TO anon, authenticated;
GRANT INSERT, DELETE ON public.review_reaction TO authenticated;
GRANT ALL ON public.review_reaction TO service_role;
