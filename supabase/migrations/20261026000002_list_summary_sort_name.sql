-- German alphabetical order that ignores case (accents still count).
CREATE COLLATION public.german_case_insensitive (
  provider = icu,
  locale = 'de-u-ks-level2',
  deterministic = false
);

CREATE OR REPLACE VIEW public.list_summary
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
  ) AS cover_storage_path,
  (l.name COLLATE public.german_case_insensitive) AS sort_name
FROM public.list l;
