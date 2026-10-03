import { baseToLabel } from '@/config/bases'
import { categoryToLabel } from '@/config/categories'
import { formatEnergy } from '@/lib/formatEnergy'
import { formatQuantity } from '@/lib/formatQuantity'
import { ComparedField } from '@/types/ComparedField'
import type { ProductFormValues } from '@/types/productForm'

export const EMPTY_COMPARED_VALUE = '–'
const YES_LABEL = 'Ja'
const NO_LABEL = 'Nein'

export const formatComparedFieldValue = (
  field: ComparedField,
  values: ProductFormValues,
): string => {
  switch (field) {
    case ComparedField.Category:
      return categoryToLabel(values.category)
    case ComparedField.Base:
      return values.base ? baseToLabel(values.base) : EMPTY_COMPARED_VALUE
    case ComparedField.IsOrganic:
      return values.isOrganic ? YES_LABEL : NO_LABEL
    case ComparedField.Energy:
      return values.energyJoules === null ? EMPTY_COMPARED_VALUE : formatEnergy(values.energyJoules)
    case ComparedField.Quantity:
      return formatQuantity({ unit: values.quantityUnit, value: values.quantityValue })
    case ComparedField.Name:
      return values.name || EMPTY_COMPARED_VALUE
    case ComparedField.Brand:
      return values.brand || EMPTY_COMPARED_VALUE
    case ComparedField.Description:
      return values.description || EMPTY_COMPARED_VALUE
    case ComparedField.Barcode:
      return values.barcode || EMPTY_COMPARED_VALUE
  }
}

export const formatComparedAllergen = (allergen: string, values: ProductFormValues): string =>
  values.allergens.some((candidate) => candidate === allergen) ? YES_LABEL : NO_LABEL
