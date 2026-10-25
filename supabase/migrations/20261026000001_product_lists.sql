CREATE TYPE public.list_visibility AS ENUM ('public', 'private');

CREATE TABLE public.list (
  id         uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid                  NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  name       text                  NOT NULL CHECK (name = trim(name) AND char_length(name) BETWEEN 1 AND 50),
  visibility public.list_visibility NOT NULL,
  created_at timestamptz           NOT NULL DEFAULT now(),
  updated_at timestamptz           NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX list_owner_name_key ON public.list (owner_id, lower(name));

CREATE TRIGGER list_updated_at
  BEFORE UPDATE ON public.list
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.list_entry (
  list_id    uuid        NOT NULL REFERENCES public.list(id)    ON DELETE CASCADE,
  product_id uuid        NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  added_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, product_id)
);

CREATE INDEX list_entry_product_id_idx ON public.list_entry (product_id);

ALTER TABLE public.list       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_entry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lists: public or own readable"
  ON public.list FOR SELECT
  USING (visibility = 'public' OR owner_id = auth.uid());

CREATE POLICY "lists: create own"
  ON public.list FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "lists: update own"
  ON public.list FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "lists: delete own"
  ON public.list FOR DELETE
  USING (owner_id = auth.uid());

-- The list subquery is itself filtered by the list policies, so entries are exactly as visible as their list.
CREATE POLICY "list entries: readable with list"
  ON public.list_entry FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.list WHERE id = list_id));

CREATE POLICY "list entries: add to own list"
  ON public.list_entry FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.list WHERE id = list_id AND owner_id = auth.uid()));

CREATE POLICY "list entries: remove from own list"
  ON public.list_entry FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.list WHERE id = list_id AND owner_id = auth.uid()));

GRANT SELECT ON public.list, public.list_entry TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.list TO authenticated;
GRANT INSERT, DELETE ON public.list_entry TO authenticated;

CREATE VIEW public.list_summary
  WITH (security_invoker = true) AS
SELECT
  l.id,
  l.owner_id,
  l.name,
  l.visibility,
  l.created_at,
  l.updated_at,
  (SELECT count(*) FROM public.list_entry e WHERE e.list_id = l.id)::integer AS product_count,
  (
    SELECT pi.storage_path
    FROM   public.list_entry e
    JOIN   LATERAL (
      SELECT storage_path
      FROM   public.product_image
      WHERE  product_id = e.product_id
      ORDER  BY sort_order, created_at
      LIMIT  1
    ) pi ON true
    WHERE  e.list_id = l.id
    ORDER  BY e.added_at DESC
    LIMIT  1
  ) AS cover_storage_path
FROM public.list l;

GRANT SELECT ON public.list_summary TO anon, authenticated;

-- Admins cannot read Private Lists, so a Merge moves the entries here without returning any List data.
CREATE FUNCTION public.move_list_entries(duplicate_product_ids uuid[], merged_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can move list entries' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.list_entry (list_id, product_id, added_at)
  SELECT list_id, merged_product_id, min(added_at)
  FROM   public.list_entry
  WHERE  product_id = ANY (duplicate_product_ids)
  GROUP  BY list_id
  ON CONFLICT (list_id, product_id)
  DO UPDATE SET added_at = least(public.list_entry.added_at, EXCLUDED.added_at);

  DELETE FROM public.list_entry
  WHERE product_id = ANY (duplicate_product_ids)
    AND product_id <> merged_product_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.move_list_entries FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.move_list_entries TO authenticated;
