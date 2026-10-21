import { describe, expect, it } from 'vitest'
import { convert, convertLength, fromCm, parseLengthInput, roundTo, toCm } from './units'

describe('unit conversion', () => {
  it('converts cm to m', () => {
    expect(toCm(2, 'm')).toBeCloseTo(200)
    expect(fromCm(200, 'm')).toBeCloseTo(2)
  })

  it('converts cm to inches', () => {
    expect(toCm(1, 'in')).toBeCloseTo(2.54)
    expect(fromCm(2.54, 'in')).toBeCloseTo(1)
  })

  it('converts between arbitrary units via cm', () => {
    expect(convert(100, 'cm', 'm')).toBeCloseTo(1)
    expect(convert(1, 'm', 'in')).toBeCloseTo(100 / 2.54)
  })

  it('returns the same value when units match', () => {
    expect(convert(42, 'cm', 'cm')).toBe(42)
  })

  it('rounds to given decimal places', () => {
    expect(roundTo(1.23456, 2)).toBe(1.23)
    expect(roundTo(1.005, 2)).toBeCloseTo(1.0, 1)
  })
})

describe('convertLength', () => {
  it('converts and rounds to a readable precision', () => {
    expect(convertLength(240, 'cm', 'm')).toBe(2.4)
    expect(convertLength(240, 'cm', 'in')).toBe(94.4882)
    expect(convertLength(1.25, 'm', 'cm')).toBe(125)
  })

  it('returns the original value when units match', () => {
    expect(convertLength(94.48819, 'in', 'in')).toBe(94.48819)
  })

  it('survives a round trip back to the original unit', () => {
    const inches = convertLength(240, 'cm', 'in')
    expect(convertLength(inches, 'in', 'cm')).toBe(240)
    const meters = convertLength(125, 'cm', 'm')
    expect(convertLength(meters, 'm', 'cm')).toBe(125)
  })

  it('keeps zero as zero', () => {
    expect(convertLength(0, 'cm', 'in')).toBe(0)
  })
})

describe('parseLengthInput', () => {
  it('parses whole and dot-decimal numbers, ignoring surrounding spaces', () => {
    expect(parseLengthInput('125')).toBe(125)
    expect(parseLengthInput(' 2.4 ')).toBe(2.4)
    expect(parseLengthInput('.5')).toBe(0.5)
  })

  it('accepts a comma as the decimal separator', () => {
    expect(parseLengthInput('2,4')).toBe(2.4)
    expect(parseLengthInput(',75')).toBe(0.75)
  })

  it('rejects zero, negatives, text and number formats beyond plain decimals', () => {
    for (const raw of ['', '0', '0,0', '-5', 'abc', '12cm', '1e3', '0x10', '1.2.3', '1,2,3', '125x2']) {
      expect(parseLengthInput(raw)).toBeNull()
    }
  })
})
