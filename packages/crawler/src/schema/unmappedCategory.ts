export interface UnmappedCategory {
  sourceUrl: string
  name: string
  /** site-specific category information that could not be mapped, e.g. a slug or breadcrumbs */
  hint: string | null
}
