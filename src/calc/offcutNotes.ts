import type { OffcutLink, WallAllocation } from '../types'
import { roundTo } from './units'

/**
 * Formats offcut links as a compact list for the breakdown notes, e.g.
 * "W5 (100 cm), W7 ×2 (80 cm)". Lengths are included for the source wall's
 * note, where they tell the installer how much offcut to keep.
 */
export function formatOffcutLinks(links: OffcutLink[], unit: string, withLength: boolean): string {
  return links
    .map((link) => {
      const name = link.label || link.wallId
      const count = link.count > 1 ? ` ×${link.count}` : ''
      const length = withLength ? ` (${roundTo(link.length)} ${unit})` : ''
      return `${name}${count}${length}`
    })
    .join(', ')
}

export interface OffcutNoteLabels {
  offcutReceivedFrom: string
  offcutGivenTo: string
}

/**
 * Builds the breakdown notes for one wall: where its pieces were cut from
 * (`received`) and which walls its offcuts go to (`given`). Each is omitted
 * when there is nothing to say.
 */
export function buildOffcutNotes(
  alloc: WallAllocation,
  unit: string,
  labels: OffcutNoteLabels,
): { received?: string; given?: string } {
  return {
    received:
      alloc.offcutsReceived.length > 0
        ? `${labels.offcutReceivedFrom}: ${formatOffcutLinks(alloc.offcutsReceived, unit, false)}`
        : undefined,
    given:
      alloc.offcutsGiven.length > 0
        ? `${labels.offcutGivenTo}: ${formatOffcutLinks(alloc.offcutsGiven, unit, true)}`
        : undefined,
  }
}
