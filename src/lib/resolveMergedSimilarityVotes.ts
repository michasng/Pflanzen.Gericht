import { canonicalizeProductPair } from '@/lib/canonicalizeProductPair'
import type { ProductSimilarityVote } from '@/types'

export const resolveMergedSimilarityVotes = (
  votes: ProductSimilarityVote[],
  replacedProductIds: string[],
  mergedProductId: string,
): ProductSimilarityVote[] => {
  const replaced = new Set(replacedProductIds)
  const toMergedId = (id: string): string => (replaced.has(id) ? mergedProductId : id)
  const voteByKey = new Map<string, ProductSimilarityVote>()
  const affirmativeFirst = [...votes].sort((a, b) => Number(b.agreed) - Number(a.agreed))
  for (const vote of affirmativeFirst) {
    const [productIdA, productIdB] = canonicalizeProductPair(
      toMergedId(vote.productIdA),
      toMergedId(vote.productIdB),
    )
    if (productIdA === productIdB) continue
    const key = JSON.stringify([productIdA, productIdB, vote.userId])
    const existing = voteByKey.get(key)
    if (!existing || vote.updatedAt > existing.updatedAt) {
      voteByKey.set(key, { ...vote, productIdA, productIdB })
    }
  }
  return [...voteByKey.values()].sort((a, b) => Number(b.agreed) - Number(a.agreed))
}
