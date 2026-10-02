export const orderProductPairByCreation = <T extends { createdAt: string }>(
  first: T,
  second: T,
): [T, T] => (first.createdAt <= second.createdAt ? [first, second] : [second, first])
