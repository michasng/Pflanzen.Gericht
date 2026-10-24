import prompts from 'prompts'
import type { CategoryMismatch } from '../sites/rewe/remapCategories.js'

const SIGINT_EXIT_CODE = 130

export const askShouldOverrideCategory = async ({
  product,
  resolvedCategory,
}: CategoryMismatch): Promise<boolean> => {
  console.log(`\n${product.brand ?? 'no brand'} - ${product.name} (${product.slug})`)
  console.log(`  categorySlug: ${product.siteDetails.categorySlug}`)
  const response = await prompts(
    {
      type: 'select',
      name: 'shouldOverride',
      message: `Keep "${product.category}" or override with "${resolvedCategory}"?`,
      choices: [
        { title: `Keep "${product.category}"`, value: false },
        { title: `Override with "${resolvedCategory}"`, value: true },
      ],
    },
    { onCancel: () => process.exit(SIGINT_EXIT_CODE) },
  )
  return response.shouldOverride === true
}
