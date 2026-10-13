export class CrawlAbortedError extends Error {
  constructor(url: string) {
    super(`Crawling was aborted by the user at ${url}.`)
    this.name = 'CrawlAbortedError'
  }
}
