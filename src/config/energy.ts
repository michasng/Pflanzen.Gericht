export enum EnergyUnit {
  Kilojoule = 'kJ',
  Kilocalorie = 'kcal',
}

export const ENERGY_UNIT_LABELS: Record<EnergyUnit, string> = {
  [EnergyUnit.Kilojoule]: 'kJ',
  [EnergyUnit.Kilocalorie]: 'kcal',
}
export const ENERGY_UNITS = Object.values(EnergyUnit)
export const DEFAULT_ENERGY_UNIT = EnergyUnit.Kilojoule

export const KILOJOULES_PER_KILOCALORIE = 4.184
