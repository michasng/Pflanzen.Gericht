import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

const SNAKE_CASE_PATTERN = '/^[a-z0-9]+(_[a-z0-9]+)+$/'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/supabase/.temp/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    name: 'app/camel-case-outside-persistence',
    files: ['src/**/*.{vue,ts}'],
    ignores: [
      'src/services/**',
      'src/types/database.ts',
      'src/**/__tests__/**',
      // Open Food Facts is an external API with its own snake_case vocabulary.
      'src/config/openFoodFacts.ts',
      'src/types/openFoodFacts.ts',
      'src/lib/mapOpenFoodFactsProductToFormValues.ts',
      'src/composables/useProductBarcodeScanner.ts',
      // Keys are stored snake_case values (categories, tags, sort options), not row columns.
      'src/config/categories.ts',
      'src/config/reviewTags.ts',
      'src/config/sortOptions.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Property[key.name=${SNAKE_CASE_PATTERN}]`,
          message: 'Use camelCase; snake_case belongs to the persistence layer in src/services.',
        },
        {
          selector: `MemberExpression[computed=false][property.name=${SNAKE_CASE_PATTERN}]`,
          message: 'Use camelCase; map rows with camelizeKeys in src/services.',
        },
      ],
    },
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)
