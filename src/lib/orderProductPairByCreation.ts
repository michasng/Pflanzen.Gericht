export const orderProductPairByCreation = <T extends { created_at: string }>(
  first: T,
  second: T,
): [T, T] => (first.created_at <= second.created_at ? [first, second] : [second, first])
