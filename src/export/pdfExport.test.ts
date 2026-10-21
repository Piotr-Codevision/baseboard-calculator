import { describe, expect, it } from 'vitest'
import { generateResultPdf, type PdfLabels } from './pdfExport'
import { PDF_FONT_FAMILY } from './pdfFonts'
import { formatCount } from '../i18n/translations'
import { calculateBaseboards } from '../calc/baseboardCalculator'
import type { Wall } from '../types'

const labels: PdfLabels = {
  title: 'Baseboard Calculator',
  generatedOn: 'Generated on',
  baseboardConfig: 'Baseboard Configuration',
  stockLength: 'Standard baseboard stock length',
  summary: 'Summary',
  totalWallLength: 'Total wall length',
  totalStockRequired: 'Total baseboard stock required',
  wastePercentage: 'Estimated waste',
  breakdown: 'Breakdown per wall',
  label: 'Label',
  length: 'Length',
  piecesColumn: 'Pieces',
  pieceCount: (count) => formatCount('en', 'piece', count),
  waste: 'Waste',
  oversizedNote: 'requires joined stock pieces',
  offcutReceivedFrom: 'Cut from offcut of',
  offcutGivenTo: 'Offcut reused for',
  page: 'Page',
}

const polishLabels: PdfLabels = {
  ...labels,
  title: 'Kalkulator Listew Przypodłogowych',
  baseboardConfig: 'Konfiguracja listwy',
  stockLength: 'Standardowa długość listwy',
  totalWallLength: 'Łączna długość ścian',
  label: 'Nazwa',
  length: 'Długość',
  oversizedNote: 'wymaga łączenia listew',
  piecesColumn: 'Sztuki',
  pieceCount: (count) => formatCount('pl', 'piece', count),
}

function wall(overrides: Partial<Wall> = {}): Wall {
  return {
    id: overrides.id ?? 'w1',
    label: overrides.label ?? 'w1',
    length: overrides.length ?? 100,
    quantity: overrides.quantity ?? 1,
    notes: overrides.notes,
  }
}

describe('generateResultPdf', () => {
  it('generates a single-page PDF for a small project', () => {
    const result = calculateBaseboards([wall({ length: 125 })], 240)
    const doc = generateResultPdf(result, { baseLength: 240, unit: 'cm' }, labels)

    expect(doc.getNumberOfPages()).toBe(1)
  })

  it('produces a reasonably small PDF file (text-only report)', () => {
    const result = calculateBaseboards([wall({ length: 125 })], 240)
    const doc = generateResultPdf(result, { baseLength: 240, unit: 'cm' }, labels)

    const output = doc.output('arraybuffer') as ArrayBuffer
    expect(output.byteLength).toBeGreaterThan(0)
    // A simple text-only report should be well under 50KB.
    expect(output.byteLength).toBeLessThan(50 * 1024)
  })

  it('flags oversized walls in the generated report without throwing', () => {
    const walls = [wall({ id: 'a', length: 500 }), wall({ id: 'b', length: 80 })]
    const result = calculateBaseboards(walls, 240)

    expect(() => generateResultPdf(result, { baseLength: 240, unit: 'cm' }, labels)).not.toThrow()
  })

  it('draws text with the embedded ReportSans font instead of the WinAnsi-only built-ins', () => {
    const result = calculateBaseboards([wall({ label: 'Łazienka – ściana północna', length: 125 })], 240)
    const doc = generateResultPdf(result, { baseLength: 240, unit: 'cm' }, polishLabels)

    const output = doc.output()
    expect(output).toMatch(/\/BaseFont \/ReportSans/)
    expect(output).toContain('/FontFile2')
    expect(doc.getFont().fontName).toBe(PDF_FONT_FAMILY)
  })

  it('has glyphs for every Polish letter in all font styles used by the report', () => {
    const doc = generateResultPdf(calculateBaseboards([wall()], 240), { baseLength: 240, unit: 'cm' }, labels)
    const characters = [...'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ…–']

    for (const style of ['normal', 'bold', 'italic']) {
      // getFont is part of jsPDF's internal API and missing from its typings.
      const internal = doc.internal as unknown as {
        getFont(family: string, style: string): {
          metadata: { cmap: { unicode: { codeMap: Record<number, number> } } }
        }
      }
      const font = internal.getFont(PDF_FONT_FAMILY, style)
      const { codeMap } = font.metadata.cmap.unicode
      const missing = characters.filter((ch) => !codeMap[ch.charCodeAt(0)])
      expect(missing, `missing glyphs in ${style}`).toEqual([])
    }
  })

  it('makes room for offcut notes and still paginates within the page', () => {
    // Every 60 cm wall after the first reuses an offcut, so most rows carry
    // a note; 70 such rows cannot fit on one page.
    const walls = Array.from({ length: 70 }, (_, i) =>
      wall({ id: `w${i}`, label: `Wall ${i} – a fairly long descriptive label`, length: 60 }),
    )
    const result = calculateBaseboards(walls, 240)
    expect(result.allocations.some((a) => a.offcutsReceived.length > 0)).toBe(true)

    const withNotes = generateResultPdf(result, { baseLength: 240, unit: 'cm' }, labels)
    const withoutNotes = generateResultPdf(
      {
        ...result,
        allocations: result.allocations.map((a) => ({ ...a, offcutsGiven: [], offcutsReceived: [] })),
      },
      { baseLength: 240, unit: 'cm' },
      labels,
    )

    expect(withNotes.getNumberOfPages()).toBeGreaterThan(withoutNotes.getNumberOfPages())
  })

  it('paginates when there are many walls', () => {
    const manyWalls = Array.from({ length: 80 }, (_, i) =>
      wall({ id: `w${i}`, label: `Wall ${i}`, length: 50 + (i % 5) }),
    )
    const result = calculateBaseboards(manyWalls, 240)
    const doc = generateResultPdf(result, { baseLength: 240, unit: 'cm' }, labels)

    expect(doc.getNumberOfPages()).toBeGreaterThan(1)
  })
})
