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

export const JOULES_PER_KILOJOULE = 1000
export const JOULES_PER_KILOCALORIE = 4184

export const JOULES_PER_ENERGY_UNIT: Record<EnergyUnit, number> = {
  [EnergyUnit.Kilojoule]: JOULES_PER_KILOJOULE,
  [EnergyUnit.Kilocalorie]: JOULES_PER_KILOCALORIE,
}
