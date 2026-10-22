import { useMemo, useRef, useState } from 'react'
import type { CalculationResult, Unit, Wall } from './types'
import { useLanguage } from './i18n/LanguageContext'
import { useLocalStorage } from './hooks/useLocalStorage'
import { generateId } from './utils/id'
import { calculateBaseboards, CalculationError } from './calc/baseboardCalculator'
import { WallTable } from './components/WallTable'
import { SummaryDashboard } from './components/SummaryDashboard'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { QuickAddWall } from './components/QuickAddWall'
import { ConfirmDialog } from './components/ConfirmDialog'
import { convertLength } from './calc/units'
import { downloadTextFile, buildTimestampedFilename } from './io/download'
import { serializeProject, readProjectFile, ProjectFileError } from './io/projectFile'
import { generateResultPdf, downloadResultPdf, type PdfLabels } from './export/pdfExport'

const DEFAULT_BASE_LENGTH = 240
const DEFAULT_UNIT: Unit = 'cm'

function createWallWithDefaultLabel(index: number): Wall {
  return { id: generateId(), label: `w${index}`, length: 0, quantity: 1, notes: '' }
}

/** A row exactly as "Add Wall" created it, which the user has not edited yet. */
function isUntouchedWall(wall: Wall, index: number): boolean {
  return (
    wall.length === 0 && wall.quantity === 1 && !wall.notes && wall.label === `w${index}`
  )
}

export default function App() {
  const { t, tCount } = useLanguage()

  const [walls, setWalls] = useLocalStorage<Wall[]>('baseboard-calc-walls', [
    createWallWithDefaultLabel(1),
  ])
  const [baseLength, setBaseLength] = useLocalStorage<number>(
    'baseboard-calc-base-length',
    DEFAULT_BASE_LENGTH,
  )
  const [unit, setUnit] = useLocalStorage<Unit>('baseboard-calc-unit', DEFAULT_UNIT)

  const [result, setResult] = useState<CalculationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  // Bumped on "Clear all" to remount components that keep their own state.
  const [resetKey, setResetKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const clearButtonRef = useRef<HTMLButtonElement>(null)

  const unitLabel = useMemo(() => unit, [unit])

  const isPristine =
    walls.length === 1 &&
    isUntouchedWall(walls[0], 1) &&
    baseLength === DEFAULT_BASE_LENGTH &&
    unit === DEFAULT_UNIT &&
    !result &&
    !error &&
    !loadError

  function handleWallChange(id: string, field: keyof Wall, value: string | number) {
    setWalls((prev) =>
      prev.map((wall) => (wall.id === id ? { ...wall, [field]: value } : wall)),
    )
    setResult(null)
  }

  function handleAddWall(length?: number) {
    setWalls((prev) => {
      if (length === undefined) {
        return [...prev, createWallWithDefaultLabel(prev.length + 1)]
      }
      // Fill a trailing untouched row instead of leaving it behind as a
      // zero-length wall that would fail validation.
      const last = prev[prev.length - 1]
      if (last && isUntouchedWall(last, prev.length)) {
        return prev.map((wall) => (wall.id === last.id ? { ...wall, length } : wall))
      }
      return [...prev, { ...createWallWithDefaultLabel(prev.length + 1), length }]
    })
    setResult(null)
  }

  function handleDeleteWall(id: string) {
    setWalls((prev) => prev.filter((wall) => wall.id !== id))
    setResult(null)
  }

  function handleUnitChange(newUnit: Unit) {
    if (newUnit === unit) return
    setWalls((prev) =>
      prev.map((wall) => ({ ...wall, length: convertLength(wall.length, unit, newUnit) })),
    )
    setBaseLength((prev) => convertLength(prev, unit, newUnit))
    setUnit(newUnit)
    setResult(null)
  }

  function handleCalculate() {
    try {
      setError(null)
      const calcResult = calculateBaseboards(walls, baseLength)
      setResult(calcResult)
    } catch (err) {
      setResult(null)
      if (err instanceof CalculationError) {
        setError(err.message)
      } else {
        setError(String(err))
      }
    }
  }

  function handleSave() {
    const json = serializeProject(walls, baseLength, unit)
    downloadTextFile(buildTimestampedFilename('baseboard-project', 'json'), json)
  }

  function handleLoadClick() {
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      setLoadError(null)
      const project = await readProjectFile(file)
      setWalls(project.walls)
      setBaseLength(project.baseLength)
      setUnit(project.unit)
      setResult(null)
      setError(null)
    } catch (err) {
      if (err instanceof ProjectFileError) {
        setLoadError(err.message)
      } else {
        setLoadError(String(err))
      }
    }
  }

  /**
   * Resets the project to a fresh start: one empty wall, default stock length
   * and unit, no result or errors. The language is a preference and is kept.
   */
  function handleClearAll() {
    setWalls([createWallWithDefaultLabel(1)])
    setBaseLength(DEFAULT_BASE_LENGTH)
    setUnit(DEFAULT_UNIT)
    setResult(null)
    setError(null)
    setLoadError(null)
    setResetKey((key) => key + 1)
    setConfirmingClear(false)
  }

  function closeClearDialog() {
    setConfirmingClear(false)
    clearButtonRef.current?.focus()
  }

  function handleExportPdf() {
    try {
      setError(null)
      const freshResult = calculateBaseboards(walls, baseLength)
      setResult(freshResult)

      const labels: PdfLabels = {
        title: t('appTitle'),
        generatedOn: t('generatedOn'),
        baseboardConfig: t('baseboardConfig'),
        stockLength: t('stockLength'),
        summary: t('summary'),
        totalWallLength: t('totalWallLength'),
        totalStockRequired: t('totalStockRequired'),
        wastePercentage: t('wastePercentage'),
        breakdown: t('breakdown'),
        label: t('label'),
        length: t('length'),
        piecesColumn: t('piecesColumn'),
        pieceCount: (count) => tCount('piece', count),
        waste: t('waste'),
        oversizedNote: t('oversizedNoteShort'),
        offcutReceivedFrom: t('offcutReceivedFrom'),
        offcutGivenTo: t('offcutGivenTo'),
        page: t('page'),
      }

      const doc = generateResultPdf(freshResult, { baseLength, unit }, labels)
      downloadResultPdf(doc, buildTimestampedFilename('baseboard-report', 'pdf'))
    } catch (err) {
      setResult(null)
      if (err instanceof CalculationError) {
        setError(err.message)
      } else {
        setError(String(err))
      }
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('appTitle')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('appSubtitle')}</p>
          </div>
          <LanguageSwitcher />
        </header>

        <section className="mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="border border-gray-300 rounded px-4 py-2 text-sm font-medium hover:bg-gray-50"
            data-testid="save-button"
          >
            {t('save')}
          </button>
          <button
            type="button"
            onClick={handleLoadClick}
            className="border border-gray-300 rounded px-4 py-2 text-sm font-medium hover:bg-gray-50"
            data-testid="load-button"
          >
            {t('load')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileSelected}
            className="hidden"
            data-testid="load-file-input"
          />
          <button
            type="button"
            onClick={handleExportPdf}
            className="border border-gray-300 rounded px-4 py-2 text-sm font-medium hover:bg-gray-50"
            data-testid="export-pdf-button"
          >
            {t('exportPdf')}
          </button>
          {loadError && (
            <span className="text-red-600 text-sm" role="alert" data-testid="load-error">
              {t('loadError')}: {loadError}
            </span>
          )}
          {/* Kept apart from the other actions and guarded by a confirmation. */}
          <button
            ref={clearButtonRef}
            type="button"
            onClick={() => setConfirmingClear(true)}
            disabled={isPristine}
            className="ml-auto border border-red-300 text-red-700 rounded px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
            data-testid="clear-all-button"
          >
            {t('clearAll')}
          </button>
        </section>

        {confirmingClear && (
          <ConfirmDialog
            title={t('clearAllTitle')}
            message={t('clearAllMessage')}
            confirmLabel={t('clearAllConfirm')}
            cancelLabel={t('cancel')}
            onConfirm={handleClearAll}
            onCancel={closeClearDialog}
          />
        )}

        <section className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">{t('baseboardConfig')}</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label htmlFor="base-length" className="block text-sm text-gray-600 mb-1">
                {t('stockLength')}
              </label>
              <input
                id="base-length"
                type="number"
                min="0"
                step="any"
                value={baseLength}
                onChange={(e) => {
                  setBaseLength(parseFloat(e.target.value) || 0)
                  setResult(null)
                }}
                onFocus={(e) => e.target.select()}
                className="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label htmlFor="unit-select" className="block text-sm text-gray-600 mb-1">
                {t('unit')}
              </label>
              <select
                id="unit-select"
                value={unit}
                onChange={(e) => handleUnitChange(e.target.value as Unit)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="cm">cm</option>
                <option value="m">m</option>
                <option value="in">in</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <h2 className="text-lg font-semibold pt-1">{t('walls')}</h2>
            <QuickAddWall
              key={resetKey}
              unit={unitLabel}
              onAdd={handleAddWall}
              autoFocus={resetKey > 0}
            />
          </div>
          <WallTable
            walls={walls}
            unit={unitLabel}
            onChange={handleWallChange}
            onDelete={handleDeleteWall}
          />
        </section>

        <section>
          <button
            type="button"
            onClick={handleCalculate}
            className="bg-emerald-600 text-white rounded px-6 py-2 text-sm font-semibold hover:bg-emerald-700"
            data-testid="calculate-button"
          >
            {t('calculate')}
          </button>
          {error && (
            <p className="mt-3 text-red-600 text-sm" role="alert" data-testid="calc-error">
              {t('validationError')}: {error}
            </p>
          )}
        </section>

        {result && <SummaryDashboard result={result} unit={unitLabel} />}
      </div>
    </div>
  )
}
