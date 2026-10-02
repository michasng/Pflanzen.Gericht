import type { InjectionKey, Ref } from 'vue'
import { ComparisonSide } from '@/types/ComparisonSide'

export const DEFAULT_COMPARISON_SIDE_LABELS: Record<ComparisonSide, string> = {
  [ComparisonSide.A]: 'User A',
  [ComparisonSide.B]: 'User B',
}

export const comparisonSideLabelsKey: InjectionKey<Ref<Record<ComparisonSide, string>>> =
  Symbol('comparisonSideLabels')
