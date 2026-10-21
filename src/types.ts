export type Unit = 'cm' | 'm' | 'in'

export interface Wall {
  id: string
  label: string
  length: number
  quantity: number
  notes?: string
}

/**
 * Offcut pieces passed between two walls, grouped per counterpart wall. The
 * counterpart may be the wall itself (a wall with quantity > 1 reusing its
 * own offcuts).
 */
export interface OffcutLink {
  wallId: string
  label: string
  /** Number of pieces cut from offcuts. */
  count: number
  /** Total length of those pieces. */
  length: number
}

export interface WallAllocation {
  wallId: string
  label: string
  length: number
  piecesUsed: number
  wasteLength: number
  /** Pieces of this wall cut from other walls' offcuts, grouped by source wall. */
  offcutsReceived: OffcutLink[]
  /** Pieces cut from this wall's offcuts for other walls, grouped by receiving wall. */
  offcutsGiven: OffcutLink[]
}

export interface CalculationResult {
  totalWallLength: number
  totalStockLength: number
  stockPiecesRequired: number
  wastePercentage: number
  wasteLength: number
  allocations: WallAllocation[]
  oversizedWalls: WallAllocation[]
}
