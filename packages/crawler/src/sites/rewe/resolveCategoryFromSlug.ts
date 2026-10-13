import type { Category } from '@pflanzen-gericht/contracts'

const CATEGORY_BY_SLUG: Readonly<Record<string, Category>> = {
  'nussmus-nusscremes': 'spread',
  erdnussbutter: 'spread',
  'zartbitter-schokolade': 'sweets',
  'pflanzliche-snacks-suesses': 'sweets',
  tofu: 'other',
  pesto: 'other',
  'soja-granulat-schnetzel': 'other',
  'pflanzliche-brotzeit': 'other',
  'veggie-tiefkuehl-fertiggerichte': 'ready_meal',
  'pflanzliche-fertiggerichte': 'ready_meal',
  'pflanzlich-kochen-geniessen': 'ready_meal',
  'frische-wraps-sandwiches': 'ready_meal',
  'tiefkuehl-backofengerichte': 'ready_meal',
  'tiefkuehl-pfannengerichte': 'ready_meal',
  'tiefkuehl-gemuesepfannen': 'ready_meal',
  chips: 'snack',
  'salzstangen-brezeln': 'snack',
  hummus: 'spread',
  kokosdrinks: 'milk',
  mandeldrinks: 'milk',
  'vegane-joghurt-alternativen': 'yogurt',
  'veggie-frikadellen-falafel': 'meat',
  'veggie-hack': 'meat',
  'veggie-schnitzel-nuggets': 'meat',
  'sushi-zutaten': 'ready_meal',
  'veggie-aufschnitt': 'sausage',
  'veggie-burger': 'meat',
  fleischsalat: 'ready_meal',
  'veggie-filets-geschnetzeltes': 'meat',
  'veggie-fisch': 'fish',
  'veggie-wuerstchen': 'sausage',
}

export const resolveCategoryFromSlug = (categorySlug: string | null): Category | null =>
  categorySlug ? (CATEGORY_BY_SLUG[categorySlug] ?? null) : null
