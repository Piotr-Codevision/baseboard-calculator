# Baseboard Calculator

A small web app for interior designers that works out how many standard-length baseboards (skirting boards) a project needs — without splicing scraps together on a wall.

Enter your wall lengths, set the stock board length, and get the number of boards to buy, the expected waste, and a per-wall cutting breakdown you can export as a PDF.

## Features

- **Wall table** — add, edit and delete walls with a label, length, quantity and notes. A quick-entry field lets you type a length and press Enter to add walls one after another (accepts `2.4` or `2,4`).
- **No splicing on a wall** — every wall that fits within the stock length is cut as one continuous piece. Only walls longer than a board are joined from full boards plus one shorter piece.
- **Offcut reuse** — leftover pieces are reused for later walls (smallest offcut that fits), and the breakdown tells you which offcut goes where, e.g. *"Offcut reused for: W5 (100 cm)"* / *"Cut from offcut of: W3"*.
- **Summary** — total wall length, boards required, waste percentage, and per-wall pieces and waste.
- **Units** — centimetres, metres or inches; switching converts all values.
- **PDF report** — a printable A4 report of the result, with full Polish character support.
- **Save / load** — projects are kept in the browser automatically and can be saved to or loaded from a JSON file.
- **Languages** — English and Polish, including correct Polish plural forms.

## Quick start

Requires [Node.js](https://nodejs.org/) 18 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173.

### With Docker (no Node.js needed)

```bash
docker build -t baseboard-calculator .
docker run -d --name baseboard-calculator -p 8080:80 baseboard-calculator
```

Open http://localhost:8080. The image builds the app with Node and serves the static files with Nginx.

See [doc/DEPLOYMENT.md](doc/DEPLOYMENT.md) for production builds, web servers (Nginx, IIS) and more Docker options.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build static files into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the unit and UI tests once |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run lint` | Lint the source |

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS, jsPDF; tests with Vitest and React Testing Library.

## Project structure

```
src/
  calc/          calculation engine, unit conversion, offcut notes
  components/    wall table, quick entry, summary dashboard, language switcher
  export/        PDF report and its embedded fonts
  i18n/          English and Polish translations, plural forms
  io/            project file save/load
  assets/fonts/  fonts embedded in the PDF report
scripts/         helper scripts (rebuilding the PDF fonts)
doc/             deployment guide
```

## License

[MIT](LICENSE) © 2026 Piotr Staniszewski

The fonts in `src/assets/fonts/` are a subset of Liberation Sans, renamed ReportSans, and are distributed under the SIL Open Font License 1.1 — see [src/assets/fonts/LICENSE.txt](src/assets/fonts/LICENSE.txt).
