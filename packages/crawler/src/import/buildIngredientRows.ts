import { parseCrawledIngredients } from './parseCrawledIngredients.js'

export const buildIngredientRows = (ingredientsRawText: string | null, productId: string) =>
  ingredientsRawText
    ? parseCrawledIngredients(ingredientsRawText).map((ingredient, index) => ({
        ...ingredient,
        product_id: productId,
        sort_order: index,
      }))
    : []
