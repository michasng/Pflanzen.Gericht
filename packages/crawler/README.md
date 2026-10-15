# @pflanzen-gericht/crawler

Standalone tooling to crawl vegan products from REWE, Knuspr, and Wolt, and to
upsert the results into the Supabase database.

## Project Setup

```sh
pnpm install
pnpm playwright:install
```

### Environment

Two git-ignored env files control which Supabase instance the `upsert` CLI writes to:

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

# crawl specific products from one site (incompatible with other arguments)
pnpm crawl --urls https://www.rewe.de/shop/p/better-nature-tempeh-geraeuchert-vegan-220g/9006709 https://www.rewe.de/shop/p/zueger-bio-cottage-drops-vegan-200g/9012174
```

## Upserting

After crawling, review `output/<site>/*.json`. Then run:

```sh
pnpm upsert              # against .env.local
pnpm upsert --env production
```

## Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```
