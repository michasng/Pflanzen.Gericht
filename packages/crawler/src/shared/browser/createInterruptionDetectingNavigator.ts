import { CrawlAbortedError } from '../crawling/CrawlAbortedError.js'

export interface InterruptionDetectingNavigation {
  goto(url: string): Promise<void>
  waitForExpectedContent(expectedSelector: string): Promise<boolean>
  askWhetherToContinue(url: string): Promise<boolean>
}

export const createInterruptionDetectingNavigator =
  ({ goto, waitForExpectedContent, askWhetherToContinue }: InterruptionDetectingNavigation) =>
  async (url: string, expectedSelector: string): Promise<void> => {
    await goto(url)
    if (await waitForExpectedContent(expectedSelector)) return
    if (await askWhetherToContinue(url)) return
    throw new CrawlAbortedError(url)
  }
