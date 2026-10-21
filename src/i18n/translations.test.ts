import { describe, expect, it } from 'vitest'
import { formatCount, translations } from './translations'

describe('formatCount', () => {
  it('uses singular and plural in English', () => {
    expect(formatCount('en', 'piece', 0)).toBe('0 pieces')
    expect(formatCount('en', 'piece', 1)).toBe('1 piece')
    expect(formatCount('en', 'piece', 2)).toBe('2 pieces')
    expect(formatCount('en', 'piece', 21)).toBe('21 pieces')
  })

  it('uses the three Polish forms: sztuka / sztuki / sztuk', () => {
    const cases: Array<[number, string]> = [
      [1, 'sztuka'],
      [2, 'sztuki'],
      [3, 'sztuki'],
      [4, 'sztuki'],
      [22, 'sztuki'],
      [34, 'sztuki'],
      [102, 'sztuki'],
      [0, 'sztuk'],
      [5, 'sztuk'],
      [11, 'sztuk'],
      [12, 'sztuk'],
      [13, 'sztuk'],
      [14, 'sztuk'],
      [21, 'sztuk'],
      [25, 'sztuk'],
      [101, 'sztuk'],
      [112, 'sztuk'],
    ]
    for (const [count, word] of cases) {
      expect(formatCount('pl', 'piece', count)).toBe(`${count} ${word}`)
    }
  })
})

describe('translations', () => {
  it('defines every English key in Polish too', () => {
    const missing = Object.keys(translations.en).filter((key) => !(key in translations.pl))
    expect(missing).toEqual([])
  })
})
