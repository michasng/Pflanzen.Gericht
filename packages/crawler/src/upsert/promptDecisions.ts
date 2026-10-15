import prompts from 'prompts'
import { CATEGORIES, type Category } from '@pflanzen-gericht/contracts'
import type { DiffEntry } from './diffProduct.js'
import type { ExistingProductSummary } from './loadExistingProducts.js'

const SIGINT_EXIT_CODE = 130

export const askCityName = async (): Promise<string> => {
  const response = await prompts(
    {
      type: 'text',
      name: 'cityName',
      message: 'City name for price reports this run:',
    },
    { onCancel: () => process.exit(SIGINT_EXIT_CODE) },
  )
  return String(response.cityName ?? '').trim()
}

export const askWhichExistingProduct = async (
  productName: string,
  matches: readonly ExistingProductSummary[],
): Promise<ExistingProductSummary | null> => {
  const response = await prompts(
    {
      type: 'select',
      name: 'productId',
      message: `"${productName}" shares source URLs with several existing products. Which one should be updated?`,
      choices: [
        ...matches.map((match) => ({
          title: `${match.name} (${match.brand ?? 'no brand'}, ${match.id})`,
          value: match.id,
        })),
        { title: 'Skip this product', value: null },
      ],
    },
    { onCancel: () => process.exit(SIGINT_EXIT_CODE) },
  )
  return matches.find((match) => match.id === response.productId) ?? null
}

export const askCategoryForUnresolved = async (productName: string): Promise<Category> => {
  const response = await prompts(
    {
      type: 'select',
      name: 'category',
      message: `"${productName}" has no auto-detected category. Choose one:`,
      choices: CATEGORIES.filter((category) => category !== 'other').map((category) => ({
        title: category,
        value: category,
      })),
    },
    { onCancel: () => process.exit(SIGINT_EXIT_CODE) },
  )
  return response.category as Category
}

export type FieldDecision = 'keep' | 'override'

export const askFieldGroupDecisions = async (
  diffEntries: DiffEntry[],
): Promise<Map<string, FieldDecision>> => {
  const decisions = new Map<string, FieldDecision>()
  for (const entry of diffEntries) {
    console.log(`\nField: ${entry.field}`)
    console.log(`  existing:  ${JSON.stringify(entry.existingValue)}`)
    console.log(`  crawled:   ${JSON.stringify(entry.candidateValue)}`)
    const response = await prompts(
      {
        type: 'select',
        name: 'decision',
        message: `Keep existing or override with crawled value for "${entry.field}"?`,
        choices: [
          { title: 'Keep existing', value: 'keep' },
          { title: 'Override with crawled value', value: 'override' },
        ],
      },
      { onCancel: () => process.exit(SIGINT_EXIT_CODE) },
    )
    decisions.set(entry.field, (response.decision as FieldDecision) ?? 'keep')
  }
  return decisions
}

export const askImageDecision = async (
  existingImageUrl: string | null,
  localImagePath: string | null,
): Promise<FieldDecision> => {
  if (!localImagePath) return 'keep'
  console.log(`\nImage comparison:`)
  console.log(`  existing (DB): ${existingImageUrl ?? '(none)'}`)
  console.log(`  crawled (local): ${localImagePath}`)
  const response = await prompts(
    {
      type: 'select',
      name: 'decision',
      message: 'Keep existing image or override with the crawled one?',
      choices: [
        { title: 'Keep existing image', value: 'keep' },
        { title: 'Override with crawled image', value: 'override' },
      ],
    },
    { onCancel: () => process.exit(SIGINT_EXIT_CODE) },
  )
  return (response.decision as FieldDecision) ?? 'keep'
}
