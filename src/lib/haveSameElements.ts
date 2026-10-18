export const haveSameElements = <Element>(
  currentElements: readonly Element[],
  nextElements: readonly Element[],
  toKey: (element: Element) => string,
): boolean => {
  if (currentElements.length !== nextElements.length) return false
  const currentKeys = currentElements.map(toKey).sort()
  const nextKeys = nextElements.map(toKey).sort()
  return currentKeys.every((key, index) => key === nextKeys[index])
}
