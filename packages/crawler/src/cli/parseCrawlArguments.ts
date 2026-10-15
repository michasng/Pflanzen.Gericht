import { Command, Option } from 'commander'
import { findSiteCrawlerByProductUrl, findSiteCrawlerById, SITE_CRAWLERS } from '../sites/index.js'

interface CrawlCliOptions {
  site?: string
  urls?: string[]
  limit?: string
  skip?: string
  continue?: boolean
}

export const parseCrawlArguments = (
  arguments_: readonly string[],
  program: Command = new Command(),
) => {
  program
    .addOption(
      new Option(
        '--site <site>',
        `which site to crawl (${SITE_CRAWLERS.map((crawler) => crawler.id).join('|')})`,
      ).conflicts('urls'),
    )
    .addOption(
      new Option(
        '--urls <urls...>',
        'crawl product pages from one site instead of a listing',
      ).conflicts(['site', 'limit', 'skip', 'continue']),
    )
    .option('--limit <count>', 'stop after this many products')
    .option('--skip <count>', 'ignore this many of the first products')
    .option('--continue', 'skip products already in the output')
    .parse(arguments_, { from: 'user' })

  const options = program.opts<CrawlCliOptions>()
  const firstProductUrl = options.urls?.[0]
  if (!options.site && !firstProductUrl) {
    program.error('Either --site or --urls is required.')
  }

  const siteCrawler = firstProductUrl
    ? findSiteCrawlerByProductUrl(firstProductUrl)
    : findSiteCrawlerById(options.site ?? '')
  if (!siteCrawler) {
    program.error(
      firstProductUrl
        ? `No site supports the URL "${firstProductUrl}".`
        : `Unknown site "${options.site}". Available: ${SITE_CRAWLERS.map((crawler) => crawler.id).join(', ')}`,
    )
  }

  for (const url of options.urls ?? []) {
    if (!siteCrawler.isProductUrl(url)) {
      program.error(
        `All URLs must be product pages from the same site (${siteCrawler.id}). Unsupported URL: "${url}".`,
      )
    }
  }

  return { options, siteCrawler }
}
