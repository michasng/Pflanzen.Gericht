-- A product's average score, review count, tags and lowest price are maintained by triggers fired by any
-- user's review, tag or price report, but product RLS only lets the product's owner update the row. Run the
-- triggers with definer rights so the update is not silently filtered out. Trigger functions cannot be invoked
-- directly, so this grants no new API access.
ALTER FUNCTION public.update_product_aggregates()     SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.handle_review_tag_change()      SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.handle_review_currency_change() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.update_product_min_price()      SECURITY DEFINER SET search_path = public;

-- Repair products whose derived fields were left stale by the bug above
WITH derived AS (
  SELECT
    p.id,
    (
      SELECT round(avg(r.overall)::numeric, 2)
      FROM   public.review r
      WHERE  r.product_id = p.id AND r.is_current = true
    ) AS avg_overall,
    (
      SELECT count(*)
      FROM   public.review r
      WHERE  r.product_id = p.id AND r.is_current = true
    )::integer AS reviews_count,
    (
      SELECT coalesce(array_agg(DISTINCT rt.tag ORDER BY rt.tag), '{}')
      FROM   public.review_tag rt
      JOIN   public.review r ON r.id = rt.review_id
      WHERE  r.product_id = p.id AND r.is_current = true
    ) AS tags,
    (
      SELECT min(pr.effective_price_euro_cents)
      FROM   public.price_report pr
      WHERE  pr.product_id = p.id
    ) AS min_price_euro_cents
  FROM public.product p
)
UPDATE public.product p
SET
  avg_overall          = derived.avg_overall,
  reviews_count        = derived.reviews_count,
  tags                 = derived.tags,
  min_price_euro_cents = derived.min_price_euro_cents
FROM derived
WHERE p.id = derived.id
  AND (
    p.avg_overall          IS DISTINCT FROM derived.avg_overall
    OR p.reviews_count     IS DISTINCT FROM derived.reviews_count
    OR p.tags              IS DISTINCT FROM derived.tags
    OR p.min_price_euro_cents IS DISTINCT FROM derived.min_price_euro_cents
  );
