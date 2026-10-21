import { describe, expect, it } from 'vitest'
import { buildOffcutNotes, formatOffcutLinks } from './offcutNotes'
import type { WallAllocation } from '../types'

const labels = { offcutReceivedFrom: 'Cut from offcut of', offcutGivenTo: 'Offcut reused for' }

function allocation(overrides: Partial<WallAllocation> = {}): WallAllocation {
  return {
    wallId: 'w3',
    label: 'W3',
    length: 140,
    piecesUsed: 1,
    wasteLength: 0,
    offcutsReceived: [],
    offcutsGiven: [],
    ...overrides,
  }
}

describe('formatOffcutLinks', () => {
  it('lists walls with counts and optional lengths', () => {
    const links = [
      { wallId: 'w5', label: 'W5', count: 1, length: 100 },
      { wallId: 'w7', label: 'W7', count: 2, length: 80.456 },
    ]

    expect(formatOffcutLinks(links, 'cm', true)).toBe('W5 (100 cm), W7 ×2 (80.46 cm)')
    expect(formatOffcutLinks(links, 'cm', false)).toBe('W5, W7 ×2')
  })

  it('falls back to the wall id when the label is empty', () => {
    expect(formatOffcutLinks([{ wallId: 'id-1', label: '', count: 1, length: 10 }], 'cm', false)).toBe('id-1')
  })
})

describe('buildOffcutNotes', () => {
  it('describes both directions, with lengths only on the source side', () => {
    const notes = buildOffcutNotes(
      allocation({
        offcutsReceived: [{ wallId: 'w1', label: 'W1', count: 1, length: 140 }],
        offcutsGiven: [{ wallId: 'w5', label: 'W5', count: 1, length: 100 }],
      }),
      'cm',
      labels,
    )

    expect(notes).toEqual({
      received: 'Cut from offcut of: W1',
      given: 'Offcut reused for: W5 (100 cm)',
    })
  })

  it('omits notes when no offcuts were passed', () => {
    expect(buildOffcutNotes(allocation(), 'cm', labels)).toEqual({
      received: undefined,
      given: undefined,
    })
  })
})
