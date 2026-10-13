import { QuantityUnit } from '@pflanzen-gericht/contracts'

export interface ParsedQuantity {
  unit: QuantityUnit
  value: number
}

export const QUANTITY_TEXT_SOURCE = String.raw`(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|st(?:ück|k)?\.?)`
const QUANTITY_PATTERN = new RegExp(`^${QUANTITY_TEXT_SOURCE}$`, 'i')
const WHOLE_NUMBER_TOLERANCE = 1e-6

const UNIT_CONVERSIONS: Readonly<Record<string, { unit: QuantityUnit; factor: number }>> = {
  kg: { unit: QuantityUnit.Gram, factor: 1000 },
  g: { unit: QuantityUnit.Gram, factor: 1 },
  l: { unit: QuantityUnit.Milliliter, factor: 1000 },
  ml: { unit: QuantityUnit.Milliliter, factor: 1 },
}
const PIECE_CONVERSION = { unit: QuantityUnit.Piece, factor: 1 }

/** Parses a single-unit size like "1,5 l"; anything else (multipacks, approximations) yields null. */
export const parseQuantity = (text: string): ParsedQuantity | null => {
  const match = QUANTITY_PATTERN.exec(text.trim())
  const amountText = match?.[1]
  const unitText = match?.[2]
  if (!amountText || !unitText) return null

  const conversion = UNIT_CONVERSIONS[unitText.toLowerCase()] ?? PIECE_CONVERSION
  const rawValue = Number.parseFloat(amountText.replace(',', '.')) * conversion.factor
  const value = Math.round(rawValue)
  if (value <= 0 || Math.abs(rawValue - value) > WHOLE_NUMBER_TOLERANCE) return null
  return { unit: conversion.unit, value }
}
