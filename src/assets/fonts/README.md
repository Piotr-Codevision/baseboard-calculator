# ReportSans

Fonts embedded in the PDF report (`src/export/pdfFonts.ts`). They are a
subset of Liberation Sans 1:2.1.5-3
(Debian `fonts-liberation`), cut down to Latin + Latin Extended-A so Polish
characters render, and renamed because "Liberation" is a Reserved Font Name
under the SIL Open Font License 1.1 (see LICENSE.txt).

Liberation Sans is metric-compatible with Helvetica, so the report layout
matches the built-in PDF font it replaced.

Regenerate with `scripts/build-pdf-fonts.sh` (instructions inside).
