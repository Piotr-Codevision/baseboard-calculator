import type { Unit } from '../types'

const CM_PER_UNIT: Record<Unit, number> = {
  cm: 1,
  m: 100,
  in: 2.54,
}

export function toCm(value: number, unit: Unit): number {
  return value * CM_PER_UNIT[unit]
}

export function fromCm(valueInCm: number, unit: Unit): number {
  return valueInCm / CM_PER_UNIT[unit]
}

export function convert(value: number, from: Unit, to: Unit): number {
  if (from === to) return value
  return fromCm(toCm(value, from), to)
}

export function roundTo(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

const LENGTH_INPUT_PATTERN = /^(\d+([.,]\d*)?|[.,]\d+)$/

/**
 * Parses a length typed as free text, accepting either a dot or a comma as
 * the decimal separator (e.g. "2.4" or "2,4"). Returns null unless the text
 * is a plain positive number.
 */
export function parseLengthInput(raw: string): number | null {
  const text = raw.trim()
  if (!LENGTH_INPUT_PATTERN.test(text)) return null
  const value = parseFloat(text.replace(',', '.'))
  return value > 0 ? value : null
}

const LENGTH_PRECISION = 4

/**
 * Converts a user-entered length between units for display in an input,
 * rounded to a fixed precision so values stay readable (e.g. 240 cm ->
 * 94.4882 in) and survive a round trip back to the original unit.
 */
export function convertLength(value: number, from: Unit, to: Unit): number {
  if (from === to) return value
  return roundTo(convert(value, from, to), LENGTH_PRECISION)
}
