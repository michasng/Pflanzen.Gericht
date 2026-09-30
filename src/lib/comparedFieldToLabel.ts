import { ComparedField } from '@/types/ComparedField'

const COMPARED_FIELD_LABELS: Record<ComparedField, string> = {
  [ComparedField.Barcode]: 'Barcode',
  [ComparedField.Name]: 'Name',
  [ComparedField.Category]: 'Kategorie',
  [ComparedField.Brand]: 'Marke / Hersteller',
  [ComparedField.Description]: 'Beschreibung',
  [ComparedField.IsOrganic]: 'Bio-Produkt',
  [ComparedField.Base]: 'Basis',
  [ComparedField.Energy]: 'Energie',
}

export const comparedFieldToLabel = (field: ComparedField): string => COMPARED_FIELD_LABELS[field]
