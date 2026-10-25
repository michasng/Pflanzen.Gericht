import type { DiffEntry } from './diffProduct.js'

export const printDiffEntry = (entry: DiffEntry): void => {
  console.log(`\nField: ${entry.field}`)
  console.log(`  existing:  ${JSON.stringify(entry.existingValue)}`)
  console.log(`  crawled:   ${JSON.stringify(entry.candidateValue)}`)
}
