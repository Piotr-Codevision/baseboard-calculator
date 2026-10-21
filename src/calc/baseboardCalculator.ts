import type { CalculationResult, OffcutLink, Wall, WallAllocation } from '../types'

const EPSILON = 1e-6

export class CalculationError extends Error {}

export function validateInputs(walls: Wall[], baseLength: number): void {
  if (!Number.isFinite(baseLength) || baseLength <= 0) {
    throw new CalculationError('Base baseboard length must be a positive number.')
  }
  for (const wall of walls) {
    if (!Number.isFinite(wall.length) || wall.length <= 0) {
      throw new CalculationError(`Wall "${wall.label || wall.id}" has an invalid length.`)
    }
    if (!Number.isFinite(wall.quantity) || wall.quantity <= 0 || !Number.isInteger(wall.quantity)) {
      throw new CalculationError(`Wall "${wall.label || wall.id}" has an invalid quantity.`)
    }
  }
}

interface Remnant {
  length: number
  allocation: WallAllocation
}

/**
 * Decomposes a single wall occurrence into the individual continuous pieces
 * that must be cut for it. A wall that fits within the stock length is
 * always exactly one piece (the "unbroken segment" rule: never spliced
 * together from smaller scraps). A wall longer than the stock length
 * unavoidably needs full stock pieces joined end-to-end, plus one final
 * shorter cut piece.
 */
function decomposeOccurrence(length: number, baseLength: number): number[] {
  if (length <= baseLength + EPSILON) {
    return [length]
  }
  const pieces = Math.ceil(length / baseLength - EPSILON)
  const result: number[] = []
  let remaining = length
  for (let i = 0; i < pieces - 1; i++) {
    result.push(baseLength)
    remaining -= baseLength
  }
  result.push(remaining)
  return result
}

/**
 * Finds the smallest available remnant that is still long enough to cover
 * the requested piece ("best fit"), minimizing the leftover scrap created
 * by reusing it. Returns -1 if no remnant is big enough.
 */
function findBestFitRemnantIndex(remnants: Remnant[], pieceLength: number): number {
  let bestIndex = -1
  let bestLength = Infinity
  for (let i = 0; i < remnants.length; i++) {
    const remnant = remnants[i]
    if (remnant.length + EPSILON >= pieceLength && remnant.length < bestLength) {
      bestLength = remnant.length
      bestIndex = i
    }
  }
  return bestIndex
}

/** Adds one offcut piece to the link for `counterpart`, creating it if needed. */
function recordOffcutLink(links: OffcutLink[], counterpart: WallAllocation, pieceLength: number): void {
  const existing = links.find((link) => link.wallId === counterpart.wallId)
  if (existing) {
    existing.count += 1
    existing.length += pieceLength
  } else {
    links.push({ wallId: counterpart.wallId, label: counterpart.label, count: 1, length: pieceLength })
  }
}

/**
 * Calculates the minimum number of stock baseboard pieces required to cover
 * all wall segments, enforcing the strict "unbroken segment" rule: every
 * individual wall is covered by a single continuous baseboard piece, never
 * spliced together from smaller scraps.
 *
 * Walls longer than the stock length unavoidably require multiple full
 * pieces joined end-to-end (the only permitted exception to splicing).
 *
 * Offcuts (waste) left over from a cut are reused where possible: when a
 * later piece fits within an existing offcut, the smallest offcut that is
 * still long enough is used ("best fit"), instead of opening a fresh stock
 * board, so total waste is minimized across the whole project. Each reuse
 * is recorded on both walls (`offcutsGiven` / `offcutsReceived`) so the
 * installer knows which offcuts to keep and where they go.
 */
export function calculateBaseboards(walls: Wall[], baseLength: number): CalculationResult {
  validateInputs(walls, baseLength)

  const allocations: WallAllocation[] = []
  const oversizedWalls: WallAllocation[] = []
  const remnants: Remnant[] = []

  let totalWallLength = 0
  let stockPiecesRequired = 0

  for (const wall of walls) {
    const fitsInSingleStock = wall.length <= baseLength + EPSILON

    const allocation: WallAllocation = {
      wallId: wall.id,
      label: wall.label,
      length: wall.length,
      piecesUsed: 0,
      wasteLength: 0,
      offcutsReceived: [],
      offcutsGiven: [],
    }
    allocations.push(allocation)
    if (!fitsInSingleStock) {
      oversizedWalls.push(allocation)
    }

    for (let occurrence = 0; occurrence < wall.quantity; occurrence++) {
      const pieceLengths = decomposeOccurrence(wall.length, baseLength)

      for (const pieceLength of pieceLengths) {
        allocation.piecesUsed += 1
        totalWallLength += pieceLength

        const reuseIndex = findBestFitRemnantIndex(remnants, pieceLength)
        if (reuseIndex !== -1) {
          const remnant = remnants[reuseIndex]
          remnant.allocation.wasteLength -= pieceLength
          remnant.length -= pieceLength
          recordOffcutLink(remnant.allocation.offcutsGiven, allocation, pieceLength)
          recordOffcutLink(allocation.offcutsReceived, remnant.allocation, pieceLength)
          if (remnant.length <= EPSILON) {
            remnants.splice(reuseIndex, 1)
          }
        } else {
          stockPiecesRequired += 1
          const leftover = baseLength - pieceLength
          if (leftover > EPSILON) {
            allocation.wasteLength += leftover
            remnants.push({ length: leftover, allocation })
          }
        }
      }
    }
  }

  const totalStockLength = stockPiecesRequired * baseLength
  const wasteLength = Math.max(0, totalStockLength - totalWallLength)
  const wastePercentage = totalStockLength > 0 ? (wasteLength / totalStockLength) * 100 : 0

  return {
    totalWallLength,
    totalStockLength,
    stockPiecesRequired,
    wastePercentage,
    wasteLength,
    allocations,
    oversizedWalls,
  }
}
