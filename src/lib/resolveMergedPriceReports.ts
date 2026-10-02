import type { PriceReport } from '@/types'

const toConflictKey = (report: PriceReport): string =>
  JSON.stringify([report.userId, report.store, report.cityName])

const isMoreRecent = (candidate: PriceReport, existing: PriceReport): boolean =>
  candidate.observedAt > existing.observedAt ||
  (candidate.observedAt === existing.observedAt && candidate.createdAt > existing.createdAt)

export const resolveMergedPriceReports = (reports: PriceReport[]): PriceReport[] => {
  const reportByConflictKey = new Map<string, PriceReport>()
  for (const report of reports) {
    const key = toConflictKey(report)
    const existing = reportByConflictKey.get(key)
    if (!existing || isMoreRecent(report, existing)) reportByConflictKey.set(key, report)
  }
  return [...reportByConflictKey.values()]
}
