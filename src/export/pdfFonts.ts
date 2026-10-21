import type jsPDF from 'jspdf'
import regularBase64 from '../assets/fonts/ReportSans-Regular.ttf?base64'
import boldBase64 from '../assets/fonts/ReportSans-Bold.ttf?base64'
import italicBase64 from '../assets/fonts/ReportSans-Italic.ttf?base64'

export const PDF_FONT_FAMILY = 'ReportSans'

const FONT_FILES = [
  { file: 'ReportSans-Regular.ttf', style: 'normal', data: regularBase64 },
  { file: 'ReportSans-Bold.ttf', style: 'bold', data: boldBase64 },
  { file: 'ReportSans-Italic.ttf', style: 'italic', data: italicBase64 },
]

/**
 * Embeds the report fonts into a jsPDF document. The built-in PDF fonts
 * (Helvetica etc.) only cover WinAnsi, so Polish letters such as ą, ę, ł,
 * ś or ż would be garbled; ReportSans (a subset of Liberation Sans, which is
 * metric-compatible with Helvetica) covers Latin Extended-A.
 */
export function registerPdfFonts(doc: jsPDF): void {
  for (const { file, style, data } of FONT_FILES) {
    doc.addFileToVFS(file, data)
    doc.addFont(file, PDF_FONT_FAMILY, style)
  }
}
