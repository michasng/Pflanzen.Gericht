-- Grant schema access to both roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- All tables are readable without authentication (RLS policies enforce row-level visibility)
GRANT SELECT ON
  public.profile,
  public.product,
  public.product_image,
  public.rating,
  public.rating_tag,
  public.rating_image
TO anon, authenticated;

-- Authenticated users may write data; RLS policies restrict to own rows
GRANT UPDATE ON public.profile TO authenticated;

GRANT INSERT, UPDATE, DELETE ON
  public.product,
  public.product_image
TO authenticated;

GRANT INSERT, UPDATE, DELETE ON
  public.rating,
  public.rating_image
TO authenticated;

-- rating_tag rows are inserted/deleted together with the parent rating, never updated
GRANT INSERT, DELETE ON public.rating_tag TO authenticated;
