import { describe, expect, it } from 'vitest'
import { calculateBaseboards, CalculationError } from './baseboardCalculator'
import type { Wall } from '../types'

function wall(overrides: Partial<Wall> = {}): Wall {
  return {
    id: overrides.id ?? 'w1',
    label: overrides.label ?? 'Test Wall',
    length: overrides.length ?? 100,
    quantity: overrides.quantity ?? 1,
    notes: overrides.notes,
  }
}

describe('calculateBaseboards', () => {
  it('allocates a single continuous piece for a wall that fits within stock length', () => {
    const result = calculateBaseboards([wall({ length: 125 })], 240)

    expect(result.allocations).toHaveLength(1)
    expect(result.allocations[0].piecesUsed).toBe(1)
    expect(result.allocations[0].length).toBe(125)
    expect(result.allocations[0].wasteLength).toBeCloseTo(115)
    expect(result.oversizedWalls).toHaveLength(0)
  })

  it('never splices small scraps together for a single wall (one piece per fitting wall)', () => {
    // A wall of 125cm must NOT be built from e.g. 50+60+15 scraps; it must be
    // exactly 1 continuous piece cut from a stock board.
    const result = calculateBaseboards([wall({ length: 125 })], 240)
    expect(result.allocations[0].piecesUsed).toBe(1)
  })

  it('requires multiple joined stock pieces for walls exceeding stock length', () => {
    const result = calculateBaseboards([wall({ length: 500 })], 240)

    expect(result.oversizedWalls).toHaveLength(1)
    const alloc = result.oversizedWalls[0]
    expect(alloc.piecesUsed).toBe(3) // ceil(500/240) = 3: 240 + 240 + 20
    expect(result.stockPiecesRequired).toBe(3)
    expect(alloc.wasteLength).toBeCloseTo(3 * 240 - 500)
  })

  it('accounts for quantity by allocating one piece per physical wall occurrence', () => {
    const result = calculateBaseboards([wall({ length: 100, quantity: 4 })], 240)

    expect(result.allocations[0].piecesUsed).toBe(4)
    // 100 fits in 240 leaving 140 waste; the 2nd occurrence's 100 can be cut
    // from that 140 leftover (reuse), etc. Only boards that are actually
    // opened count toward stockPiecesRequired.
    expect(result.totalWallLength).toBe(400)
  })

  it('reuses a leftover offcut for a smaller wall instead of opening a fresh board', () => {
    // Wall A: 120cm on a 240cm board -> leaves a 120cm offcut.
    // Wall B: 80cm -> should be cut from the 120cm offcut (reused), not a
    // fresh board, leaving a new smaller 40cm offcut.
    const walls = [
      wall({ id: 'a', label: 'A', length: 120 }),
      wall({ id: 'b', label: 'B', length: 80 }),
    ]
    const result = calculateBaseboards(walls, 240)

    expect(result.stockPiecesRequired).toBe(1)
    const allocA = result.allocations.find((a) => a.wallId === 'a')!
    const allocB = result.allocations.find((a) => a.wallId === 'b')!
    expect(allocB.piecesUsed).toBe(1)
    expect(allocB.wasteLength).toBe(0)
    // Remaining 40cm waste is attributed to the board A opened.
    expect(allocA.wasteLength).toBeCloseTo(40)
  })

  it('picks the smallest sufficient offcut (best fit) when multiple are available', () => {
    // Two boards opened leaving offcuts of 115 (240-125) and 180 (240-60).
    // A subsequent 60cm wall should reuse the smaller 115 offcut (best fit),
    // not the larger 180 one.
    const walls = [
      wall({ id: 'a', label: 'A', length: 125 }),
      wall({ id: 'b', label: 'B', length: 60 }),
      wall({ id: 'c', label: 'C', length: 60 }),
    ]
    const result = calculateBaseboards(walls, 240)

    // a: opens board 1, leftover 115
    // b: opens board 2 (115 < 60? no, 115 >= 60 -> reuses board1's 115 offcut!)
    expect(result.stockPiecesRequired).toBe(2)

    const allocA = result.allocations.find((x) => x.wallId === 'a')!
    const allocB = result.allocations.find((x) => x.wallId === 'b')!
    const allocC = result.allocations.find((x) => x.wallId === 'c')!

    // b (60) reused a's 115 leftover -> a's remaining waste = 115-60=55
    expect(allocA.wasteLength).toBeCloseTo(55)
    expect(allocB.wasteLength).toBe(0)
    // c (60) cannot fit in the remaining 55 leftover -> opens a fresh board
    expect(allocC.piecesUsed).toBe(1)
    expect(allocC.wasteLength).toBeCloseTo(180)
  })

  it('keeps the global waste consistent with the sum of per-wall waste', () => {
    const walls = [
      wall({ id: 'a', label: 'A', length: 125 }),
      wall({ id: 'b', label: 'B', length: 60, quantity: 2 }),
      wall({ id: 'c', label: 'C', length: 500 }),
    ]
    const result = calculateBaseboards(walls, 240)

    const sumAllocationWaste = result.allocations.reduce((sum, a) => sum + a.wasteLength, 0)
    expect(sumAllocationWaste).toBeCloseTo(result.wasteLength)
  })

  it('treats a wall exactly equal to the stock length as fitting (no oversize, no splice)', () => {
    const result = calculateBaseboards([wall({ length: 240 })], 240)

    expect(result.oversizedWalls).toHaveLength(0)
    expect(result.allocations[0].piecesUsed).toBe(1)
    expect(result.allocations[0].wasteLength).toBeCloseTo(0)
  })

  it('handles an oversized wall with quantity > 1', () => {
    const result = calculateBaseboards([wall({ length: 500, quantity: 2 })], 240)

    expect(result.oversizedWalls[0].piecesUsed).toBe(6) // 3 pieces per wall * 2 walls
  })

  it('returns zero waste percentage when there are no walls', () => {
    const result = calculateBaseboards([], 240)

    expect(result.stockPiecesRequired).toBe(0)
    expect(result.totalWallLength).toBe(0)
    expect(result.wastePercentage).toBe(0)
  })

  it('throws a CalculationError for non-positive base length', () => {
    expect(() => calculateBaseboards([wall()], 0)).toThrow(CalculationError)
    expect(() => calculateBaseboards([wall()], -10)).toThrow(CalculationError)
  })

  it('throws a CalculationError for invalid wall length', () => {
    expect(() => calculateBaseboards([wall({ length: 0 })], 240)).toThrow(CalculationError)
    expect(() => calculateBaseboards([wall({ length: -5 })], 240)).toThrow(CalculationError)
  })

  it('throws a CalculationError for invalid quantity', () => {
    expect(() => calculateBaseboards([wall({ quantity: 0 })], 240)).toThrow(CalculationError)
    expect(() => calculateBaseboards([wall({ quantity: 1.5 })], 240)).toThrow(CalculationError)
  })

  describe('offcut reuse records', () => {
    function alloc(result: ReturnType<typeof calculateBaseboards>, id: string) {
      return result.allocations.find((a) => a.wallId === id)!
    }

    it('links the source and receiving wall when an offcut is reused', () => {
      const result = calculateBaseboards(
        [wall({ id: 'a', label: 'A', length: 120 }), wall({ id: 'b', label: 'B', length: 80 })],
        240,
      )

      expect(alloc(result, 'a').offcutsGiven).toEqual([{ wallId: 'b', label: 'B', count: 1, length: 80 }])
      expect(alloc(result, 'a').offcutsReceived).toEqual([])
      expect(alloc(result, 'b').offcutsReceived).toEqual([{ wallId: 'a', label: 'A', count: 1, length: 80 }])
      expect(alloc(result, 'b').offcutsGiven).toEqual([])
    })

    it('lists every wall that receives part of one offcut (chained reuse)', () => {
      // a leaves 100; b takes 60 of it, leaving 40; c takes 30 of the rest.
      const result = calculateBaseboards(
        [
          wall({ id: 'a', label: 'A', length: 140 }),
          wall({ id: 'b', label: 'B', length: 60 }),
          wall({ id: 'c', label: 'C', length: 30 }),
        ],
        240,
      )

      expect(result.stockPiecesRequired).toBe(1)
      expect(alloc(result, 'a').offcutsGiven).toEqual([
        { wallId: 'b', label: 'B', count: 1, length: 60 },
        { wallId: 'c', label: 'C', count: 1, length: 30 },
      ])
      expect(alloc(result, 'c').offcutsReceived).toEqual([{ wallId: 'a', label: 'A', count: 1, length: 30 }])
    })

    it('groups several pieces passed between the same two walls', () => {
      const result = calculateBaseboards(
        [wall({ id: 'a', label: 'A', length: 100 }), wall({ id: 'b', label: 'B', length: 60, quantity: 2 })],
        240,
      )

      expect(alloc(result, 'a').offcutsGiven).toEqual([{ wallId: 'b', label: 'B', count: 2, length: 120 }])
      expect(alloc(result, 'b').offcutsReceived).toEqual([{ wallId: 'a', label: 'A', count: 2, length: 120 }])
    })

    it('records a wall reusing its own offcuts', () => {
      const result = calculateBaseboards([wall({ id: 'a', label: 'A', length: 80, quantity: 3 })], 240)

      expect(result.stockPiecesRequired).toBe(1)
      expect(alloc(result, 'a').offcutsGiven).toEqual([{ wallId: 'a', label: 'A', count: 2, length: 160 }])
      expect(alloc(result, 'a').offcutsReceived).toEqual([{ wallId: 'a', label: 'A', count: 2, length: 160 }])
    })

    it('leaves the lists empty when every piece comes from a new board', () => {
      const result = calculateBaseboards(
        [wall({ id: 'a', length: 200 }), wall({ id: 'b', length: 200 })],
        240,
      )

      for (const a of result.allocations) {
        expect(a.offcutsGiven).toEqual([])
        expect(a.offcutsReceived).toEqual([])
      }
    })
  })

  it('handles floating point lengths close to the stock boundary without false oversizing', () => {
    const result = calculateBaseboards([wall({ length: 239.9999995 })], 240)
    expect(result.oversizedWalls).toHaveLength(0)
    expect(result.allocations[0].piecesUsed).toBe(1)
  })
})
