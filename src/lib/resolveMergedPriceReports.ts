import type { PriceReport } from '@/types'

const toConflictKey = (report: PriceReport): string =>
  JSON.stringify([report.user_id, report.store, report.city_name])

const isMoreRecent = (candidate: PriceReport, existing: PriceReport): boolean =>
  candidate.observed_at > existing.observed_at ||
  (candidate.observed_at === existing.observed_at && candidate.created_at > existing.created_at)

export const resolveMergedPriceReports = (reports: PriceReport[]): PriceReport[] => {
  const reportByConflictKey = new Map<string, PriceReport>()
  for (const report of reports) {
    const key = toConflictKey(report)
    const existing = reportByConflictKey.get(key)
    if (!existing || isMoreRecent(report, existing)) reportByConflictKey.set(key, report)
  }
  return [...reportByConflictKey.values()]
}
