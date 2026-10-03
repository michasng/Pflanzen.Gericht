export enum QuantityUnit {
  Milliliter = 'ml',
  Gram = 'g',
  Piece = 'piece',
}

export enum QuantityInputUnit {
  Milliliter = 'ml',
  Liter = 'l',
  Gram = 'g',
  Kilogram = 'kg',
  Piece = 'piece',
}

export const QUANTITY_INPUT_UNITS = Object.values(QuantityInputUnit)
export const DEFAULT_QUANTITY_INPUT_UNIT = QuantityInputUnit.Gram

export const QUANTITY_INPUT_UNIT_LABELS: Record<QuantityInputUnit, string> = {
  [QuantityInputUnit.Milliliter]: 'ml',
  [QuantityInputUnit.Liter]: 'l',
  [QuantityInputUnit.Gram]: 'g',
  [QuantityInputUnit.Kilogram]: 'kg',
  [QuantityInputUnit.Piece]: 'Stück',
}

export const QUANTITY_UNIT_LABELS: Record<QuantityUnit, string> = {
  [QuantityUnit.Milliliter]: 'ml',
  [QuantityUnit.Gram]: 'g',
  [QuantityUnit.Piece]: 'Stück',
}

export const QUANTITY_INPUT_UNIT_STORAGE: Record<
  QuantityInputUnit,
  { unit: QuantityUnit; factor: number }
> = {
  [QuantityInputUnit.Milliliter]: { unit: QuantityUnit.Milliliter, factor: 1 },
  [QuantityInputUnit.Liter]: { unit: QuantityUnit.Milliliter, factor: 1000 },
  [QuantityInputUnit.Gram]: { unit: QuantityUnit.Gram, factor: 1 },
  [QuantityInputUnit.Kilogram]: { unit: QuantityUnit.Gram, factor: 1000 },
  [QuantityInputUnit.Piece]: { unit: QuantityUnit.Piece, factor: 1 },
}

export const UNITS_PER_LARGE_QUANTITY_UNIT = 1000
