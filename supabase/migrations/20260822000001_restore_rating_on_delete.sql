CREATE OR REPLACE FUNCTION public.restore_previous_rating()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.is_current THEN
    UPDATE public.rating
    SET    is_current = true
    WHERE  id = (
      SELECT id
      FROM   public.rating
      WHERE  product_id = OLD.product_id
        AND  user_id    = OLD.user_id
        AND  is_current = false
      ORDER  BY created_at DESC
      LIMIT  1
    );
  END IF;
  RETURN NULL;
END;
$$;

-- Promote the most recent superseded rating when the current one is deleted
CREATE TRIGGER rating_restore_previous
  AFTER DELETE ON public.rating
  FOR EACH ROW EXECUTE FUNCTION public.restore_previous_rating();
