import { config as loadDotenv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const CRAWLER_PACKAGE_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..')

export interface CrawlerEnv {
  supabaseUrl: string
  supabaseSecretKey: string
  importUserId: string
}

export const loadCrawlerEnv = (target: 'local' | 'production'): CrawlerEnv => {
  const fileName = target === 'local' ? '.env.local' : '.env.production.local'
  loadDotenv({ path: path.join(CRAWLER_PACKAGE_ROOT, fileName) })

  const supabaseUrl = process.env.SUPABASE_URL ?? ''
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY ?? ''
  const importUserId = process.env.CRAWLER_IMPORT_USER_ID ?? ''

  if (!supabaseUrl || !supabaseSecretKey || !importUserId) {
    throw new Error(
      `Missing env vars in ${fileName}. Required: SUPABASE_URL, SUPABASE_SECRET_KEY, CRAWLER_IMPORT_USER_ID.`,
    )
  }

  return { supabaseUrl, supabaseSecretKey, importUserId }
}
