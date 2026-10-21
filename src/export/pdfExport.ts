import jsPDF from 'jspdf'
import type { CalculationResult, Unit } from '../types'
import { PDF_FONT_FAMILY, registerPdfFonts } from './pdfFonts'
import { buildOffcutNotes } from '../calc/offcutNotes'

export interface PdfLabels {
  title: string
  generatedOn: string
  baseboardConfig: string
  stockLength: string
  summary: string
  totalWallLength: string
  totalStockRequired: string
  wastePercentage: string
  breakdown: string
  label: string
  length: string
  piecesColumn: string
  /** Count with the inflected noun, e.g. "4 sztuki". */
  pieceCount: (count: number) => string
  waste: string
  oversizedNote: string
  offcutReceivedFrom: string
  offcutGivenTo: string
  page: string
}

type RGB = [number, number, number]

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 16
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const HEADER_HEIGHT = 26
const FOOTER_Y = PAGE_HEIGHT - 16
const BOTTOM_LIMIT = FOOTER_Y - 6
const OFFCUT_NOTE_HEIGHT = 4.5

const COLOR = {
  primary: [30, 41, 59] as RGB,
  accent: [5, 150, 105] as RGB,
  text: [17, 24, 39] as RGB,
  muted: [100, 116, 139] as RGB,
  headerSubtext: [203, 213, 225] as RGB,
  border: [226, 232, 240] as RGB,
  headerFill: [241, 245, 249] as RGB,
  zebra: [248, 250, 252] as RGB,
  warnBg: [255, 247, 237] as RGB,
  warnText: [146, 64, 14] as RGB,
  white: [255, 255, 255] as RGB,
}

function formatNumber(value: number): string {
  return (Math.round(value * 100) / 100).toString()
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}\u2026` : text
}

function setFill(doc: jsPDF, color: RGB): void {
  doc.setFillColor(color[0], color[1], color[2])
}

function setDraw(doc: jsPDF, color: RGB): void {
  doc.setDrawColor(color[0], color[1], color[2])
}

function setText(doc: jsPDF, color: RGB): void {
  doc.setTextColor(color[0], color[1], color[2])
}

interface StatCard {
  label: string
  value: string
}

/**
 * Builds a polished, dashboard-style one-pass PDF report of a calculation
 * result: a branded header, highlighted stat cards for the baseboard
 * configuration and summary figures, and a zebra-striped breakdown table
 * with clearly flagged oversized walls. The report remains text/vector-only
 * (no images; only small subset fonts with Polish glyphs are embedded),
 * keeping file size small even for projects with many walls.
 */
export function generateResultPdf(
  result: CalculationResult,
  config: { baseLength: number; unit: Unit },
  labels: PdfLabels,
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  registerPdfFonts(doc)
  const unit = config.unit
  let y = MARGIN

  function drawBrandHeader(): void {
    setFill(doc, COLOR.primary)
    doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F')
    setFill(doc, COLOR.accent)
    doc.rect(0, HEADER_HEIGHT - 1.2, PAGE_WIDTH, 1.2, 'F')

    doc.setFont(PDF_FONT_FAMILY, 'bold')
    doc.setFontSize(18)
    setText(doc, COLOR.white)
    doc.text(labels.title, MARGIN, 15)

    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(9)
    setText(doc, COLOR.headerSubtext)
    doc.text(`${labels.generatedOn}: ${new Date().toLocaleString()}`, MARGIN, 21.5)

    setText(doc, COLOR.text)
    y = HEADER_HEIGHT + 10
  }

  function drawSectionHeading(text: string): void {
    setFill(doc, COLOR.accent)
    doc.rect(MARGIN, y - 3.2, 3, 3, 'F')
    doc.setFont(PDF_FONT_FAMILY, 'bold')
    doc.setFontSize(11.5)
    setText(doc, COLOR.text)
    doc.text(text, MARGIN + 5.5, y)
    y += 8
  }

  function drawStatCards(cards: StatCard[], width: number = CONTENT_WIDTH): void {
    const height = 22
    const gap = 6
    const cardWidth = (width - gap * (cards.length - 1)) / cards.length

    cards.forEach((card, i) => {
      const cx = MARGIN + i * (cardWidth + gap)

      setDraw(doc, COLOR.border)
      doc.setLineWidth(0.3)
      setFill(doc, COLOR.white)
      doc.roundedRect(cx, y, cardWidth, height, 1.5, 1.5, 'FD')
      setFill(doc, COLOR.accent)
      doc.rect(cx, y, 1.3, height, 'F')

      doc.setFont(PDF_FONT_FAMILY, 'normal')
      doc.setFontSize(8)
      setText(doc, COLOR.muted)
      const labelLines = doc.splitTextToSize(card.label, cardWidth - 7) as string[]
      doc.text(labelLines.slice(0, 2), cx + 5, y + 6.5)

      doc.setFont(PDF_FONT_FAMILY, 'bold')
      doc.setFontSize(13)
      setText(doc, COLOR.text)
      doc.text(truncate(card.value, 22), cx + 5, y + 18)
    })

    setText(doc, COLOR.text)
    y += height + 9
  }

  const tableX = {
    label: MARGIN,
    lengthRight: MARGIN + 110,
    piecesRight: MARGIN + 142,
    wasteRight: PAGE_WIDTH - MARGIN,
  }

  function drawTableHeader(): void {
    setFill(doc, COLOR.headerFill)
    doc.rect(MARGIN, y - 4.5, CONTENT_WIDTH, 7, 'F')
    doc.setFont(PDF_FONT_FAMILY, 'bold')
    doc.setFontSize(8.5)
    setText(doc, COLOR.muted)
    doc.text(labels.label.toUpperCase(), tableX.label + 2, y)
    doc.text(`${labels.length.toUpperCase()} (${unit})`, tableX.lengthRight, y, { align: 'right' })
    doc.text(labels.piecesColumn.toUpperCase(), tableX.piecesRight, y, { align: 'right' })
    doc.text(`${labels.waste.toUpperCase()} (${unit})`, tableX.wasteRight, y, { align: 'right' })
    y += 5
    setDraw(doc, COLOR.border)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
    y += 5.5
  }

  /** Secondary row line with a small drawn "↳" hook (the glyph is not in the font). */
  function drawOffcutNote(text: string): void {
    const hookX = tableX.label + 3
    setDraw(doc, COLOR.muted)
    doc.setLineWidth(0.25)
    doc.line(hookX, y - 2.8, hookX, y - 1.1)
    doc.line(hookX, y - 1.1, hookX + 1.8, y - 1.1)

    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(7.5)
    setText(doc, COLOR.muted)
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 10) as string[]
    const line = lines.length > 1 ? `${lines[0].replace(/[\s,]+$/, '')}…` : lines[0]
    doc.text(line, tableX.label + 6, y)
  }

  function startContinuationPage(): void {
    doc.addPage()
    y = MARGIN
    drawSectionHeading(labels.breakdown)
    drawTableHeader()
  }

  drawBrandHeader()

  drawSectionHeading(labels.baseboardConfig)
  drawStatCards([{ label: labels.stockLength, value: `${formatNumber(config.baseLength)} ${unit}` }], 85)

  drawSectionHeading(labels.summary)
  drawStatCards([
    { label: labels.totalWallLength, value: `${formatNumber(result.totalWallLength)} ${unit}` },
    { label: labels.totalStockRequired, value: labels.pieceCount(result.stockPiecesRequired) },
    { label: labels.wastePercentage, value: `${formatNumber(result.wastePercentage)}%` },
  ])

  drawSectionHeading(labels.breakdown)
  drawTableHeader()

  const oversizedIds = new Set(result.oversizedWalls.map((w) => w.wallId))

  result.allocations.forEach((alloc, i) => {
    const isOversized = oversizedIds.has(alloc.wallId)
    const { received, given } = buildOffcutNotes(alloc, unit, labels)
    const offcutNotes = [received, given].filter((note): note is string => note !== undefined)
    const rowHeight = (isOversized ? 12 : 7) + offcutNotes.length * OFFCUT_NOTE_HEIGHT

    if (y + rowHeight > BOTTOM_LIMIT) {
      startContinuationPage()
    }

    if (i % 2 === 0) {
      setFill(doc, COLOR.zebra)
      doc.rect(MARGIN, y - 5, CONTENT_WIDTH, rowHeight, 'F')
    }

    const labelText = alloc.label || alloc.wallId
    const piecesText = labels.pieceCount(alloc.piecesUsed)

    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(9)
    setText(doc, COLOR.text)
    doc.text(truncate(labelText, 44), tableX.label + 2, y)
    doc.text(formatNumber(alloc.length), tableX.lengthRight, y, { align: 'right' })
    doc.text(piecesText, tableX.piecesRight, y, { align: 'right' })
    doc.text(formatNumber(alloc.wasteLength), tableX.wasteRight, y, { align: 'right' })

    if (isOversized) {
      y += 5
      setFill(doc, COLOR.warnBg)
      doc.rect(tableX.label, y - 4, CONTENT_WIDTH, 5, 'F')

      const iconCx = tableX.label + 2.3
      const iconCy = y - 1.2
      setFill(doc, COLOR.warnText)
      doc.circle(iconCx, iconCy, 1.6, 'F')
      doc.setFont(PDF_FONT_FAMILY, 'bold')
      doc.setFontSize(6)
      setText(doc, COLOR.white)
      doc.text('!', iconCx, iconCy + 0.75, { align: 'center' })

      doc.setFont(PDF_FONT_FAMILY, 'italic')
      doc.setFontSize(7.5)
      setText(doc, COLOR.warnText)
      doc.text(labels.oversizedNote, tableX.label + 6, y)
    }

    for (const note of offcutNotes) {
      y += OFFCUT_NOTE_HEIGHT
      drawOffcutNote(note)
    }

    y += isOversized ? 6 : 7
  })

  setDraw(doc, COLOR.border)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y - 3, PAGE_WIDTH - MARGIN, y - 3)

  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    setDraw(doc, COLOR.border)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, FOOTER_Y, PAGE_WIDTH - MARGIN, FOOTER_Y)
    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(8)
    setText(doc, COLOR.muted)
    doc.text(labels.title, MARGIN, FOOTER_Y + 5)
    doc.text(`${labels.page} ${p} / ${totalPages}`, PAGE_WIDTH - MARGIN, FOOTER_Y + 5, {
      align: 'right',
    })
  }

  return doc
}

export function downloadResultPdf(doc: jsPDF, filename: string): void {
  doc.save(filename)
}
