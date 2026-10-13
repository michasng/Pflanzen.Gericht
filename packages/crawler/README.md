# @pflanzen-gericht/crawler

Standalone tooling to crawl vegan products from REWE, Knuspr, and Wolt, and to
consolidate the results into the Supabase database.

## Project Setup

```sh
pnpm install
pnpm playwright:install
```

### Environment

Two git-ignored env files control which Supabase instance the `consolidate` CLI writes to:

| File                    | Target          |
| ----------------------- | --------------- |
| `.env.local`            | local (default) |
| `.env.production.local` | production      |

Copy the matching example file and fill in the values:

```sh
cp .env.local.example .env.local
```

Required variables: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CRAWLER_IMPORT_USER_ID`.

## Crawling

Each site is crawled independently and writes one JSON file plus one image per product
to `output/<site>/<product-slug>.{json,ext}` (overwritten on every run). Crawling opens a
visible browser window so you can solve any Cloudflare/captcha challenge manually.

```sh
pnpm crawl --site rewe
pnpm crawl --site knuspr
pnpm crawl --site wolt

pnpm crawl --site rewe --limit 5  # stop early
pnpm crawl --site rewe --skip 5   # skip some
pnpm crawl --site rewe --continue # skip already crawled products

# crawl a specific product, incompatible with other options
pnpm crawl --url https://www.rewe.de/shop/p/better-nature-tempeh-geraeuchert-vegan-220g/9006709
```

REWE products whose category slug could not be mapped are saved with `category: null` and
their `siteDetails.categorySlug`. After adding the slug to `resolveCategoryFromSlug.ts`, fix
the existing output without re-crawling:

```sh
pnpm rewe:remap-categories
```

## Consolidating

After crawling, review `output/<site>/*.json` and delete any files for products you don't
want to import. Then run:

```sh
pnpm consolidate              # against .env.local
pnpm consolidate --env production
```

This matches crawled products against existing database products, prompts you to confirm
new products or resolve differences against matches, and inserts price reports per store.

## Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```
