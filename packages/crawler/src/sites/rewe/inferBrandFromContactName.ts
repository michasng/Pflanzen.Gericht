const WORD_SEPARATOR_PATTERN = /\s+/

/** Fallback for products without a brand: the words that the product name and contact name start with in common. */
export const inferBrandFromContactName = (
  productName: string,
  contactName: string | null,
): string | null => {
  if (!contactName) return null
  const contactWords = contactName.trim().split(WORD_SEPARATOR_PATTERN)
  const productWords = productName.trim().split(WORD_SEPARATOR_PATTERN)
  const sharedWordCount = productWords.findIndex(
    (productWord, index) => productWord.toLowerCase() !== contactWords[index]?.toLowerCase(),
  )
  const brandWordCount = sharedWordCount === -1 ? productWords.length : sharedWordCount
  if (brandWordCount === 0) return null
  return productWords.slice(0, brandWordCount).join(' ')
}
