export const collectAsync = async <Item>(items: AsyncIterable<Item>): Promise<Item[]> => {
  const collected: Item[] = []
  for await (const item of items) collected.push(item)
  return collected
}
