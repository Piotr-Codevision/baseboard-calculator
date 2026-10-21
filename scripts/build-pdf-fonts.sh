#!/bin/sh
# Builds the "ReportSans" fonts embedded in the PDF report: Liberation Sans
# (Debian fonts-liberation, SIL OFL 1.1) subset to Latin + Latin Extended-A,
# which covers Polish. "Liberation" is a Reserved Font Name under the OFL, so
# the modified (subset) fonts are renamed.
#
# Run from the project root:
#   docker run --rm -v "$PWD/scripts:/scripts:ro" -v "$PWD/src/assets/fonts:/out" \
#     python:3.12-slim sh /scripts/build-pdf-fonts.sh
set -e
apt-get update -qq >/dev/null
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq fonts-liberation >/dev/null 2>&1
pip install -q fonttools >/dev/null 2>&1

SRC=/usr/share/fonts/truetype/liberation
OUT=/out
UNICODES="U+0020-007E,U+00A0-017F,U+2013-2014,U+2018-201E,U+2022,U+2026,U+20AC"

for style in Regular Bold Italic; do
  pyftsubset "$SRC/LiberationSans-$style.ttf" \
    --unicodes="$UNICODES" \
    --layout-features='' \
    --no-hinting \
    --desubroutinize \
    --name-IDs='*' \
    --output-file="/tmp/ReportSans-$style.ttf"

  python3 - "$style" <<'EOF'
import sys
from fontTools.ttLib import TTFont

style = sys.argv[1]
font = TTFont(f"/tmp/ReportSans-{style}.ttf")
names = {
    1: "ReportSans",
    2: style,
    3: f"ReportSans-{style}; subset of Liberation Sans",
    4: "ReportSans" if style == "Regular" else f"ReportSans {style}",
    6: f"ReportSans-{style}",
}
table = font["name"]
for record in list(table.names):
    if record.nameID in (16, 17, 21, 22):
        table.removeNames(nameID=record.nameID)
for name_id, value in names.items():
    table.setName(value, name_id, 3, 1, 0x409)
    table.setName(value, name_id, 1, 0, 0)
font.save(f"/out/ReportSans-{style}.ttf")
EOF
done

rm -f "$OUT"/LiberationSans-*.ttf "$OUT/VERSION.txt"
cp /usr/share/doc/fonts-liberation/copyright "$OUT/LICENSE.txt"
cat > "$OUT/README.md" <<EOF
# ReportSans

Fonts embedded in the PDF report (\`src/export/pdfFonts.ts\`). They are a
subset of Liberation Sans $(dpkg-query -W -f='${Version}' fonts-liberation)
(Debian \`fonts-liberation\`), cut down to Latin + Latin Extended-A so Polish
characters render, and renamed because "Liberation" is a Reserved Font Name
under the SIL Open Font License 1.1 (see LICENSE.txt).

Liberation Sans is metric-compatible with Helvetica, so the report layout
matches the built-in PDF font it replaced.

Regenerate with \`scripts/build-pdf-fonts.sh\` (instructions inside).
EOF
ls -la "$OUT"
