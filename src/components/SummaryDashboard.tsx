import type { CalculationResult } from '../types'
import { useLanguage } from '../i18n/LanguageContext'
import type { ReactNode } from 'react'
import { roundTo } from '../calc/units'
import { buildOffcutNotes } from '../calc/offcutNotes'

interface SummaryDashboardProps {
  result: CalculationResult
  unit: string
}

export function SummaryDashboard({ result, unit }: SummaryDashboardProps) {
  const { t, tCount } = useLanguage()

  return (
    <div className="mt-6 border-t border-gray-200 pt-6" data-testid="summary-dashboard">
      <h2 className="text-lg font-semibold mb-4">{t('summary')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label={t('totalWallLength')}
          value={`${roundTo(result.totalWallLength)} ${unit}`}
          testId="summary-total-wall-length"
        />
        <SummaryCard
          label={t('totalStockRequired')}
          value={tCount('piece', result.stockPiecesRequired)}
          testId="summary-stock-required"
        />
        <SummaryCard
          label={t('wastePercentage')}
          value={`${roundTo(result.wastePercentage)}%`}
          testId="summary-waste-percentage"
        />
      </div>

      <h3 className="text-md font-semibold mb-2">{t('breakdown')}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" data-testid="breakdown-table">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-2 px-2 font-semibold text-sm text-gray-600">{t('label')}</th>
              <th className="py-2 px-2 font-semibold text-sm text-gray-600">{t('length')}</th>
              <th className="py-2 px-2 font-semibold text-sm text-gray-600">{t('piecesColumn')}</th>
              <th className="py-2 px-2 font-semibold text-sm text-gray-600">{t('waste')}</th>
            </tr>
          </thead>
          <tbody>
            {result.allocations.map((alloc) => {
              const isOversized = result.oversizedWalls.some((o) => o.wallId === alloc.wallId)
              const notes = buildOffcutNotes(alloc, unit, {
                offcutReceivedFrom: t('offcutReceivedFrom'),
                offcutGivenTo: t('offcutGivenTo'),
              })
              return (
                <tr
                  key={alloc.wallId}
                  className="border-b border-gray-100"
                  data-testid={`breakdown-row-${alloc.wallId}`}
                >
                  <td className="py-2 px-2 text-sm">
                    {alloc.label || alloc.wallId}
                    {isOversized && (
                      <span
                        className="ml-2 text-amber-600 text-xs"
                        title={t('oversizedWarning')}
                        data-testid={`oversized-badge-${alloc.wallId}`}
                      >
                        ⚠ {t('oversizedWarning')}
                      </span>
                    )}
                    {notes.received && (
                      <OffcutNote testId={`offcut-received-${alloc.wallId}`}>{notes.received}</OffcutNote>
                    )}
                    {notes.given && (
                      <OffcutNote testId={`offcut-given-${alloc.wallId}`}>{notes.given}</OffcutNote>
                    )}
                  </td>
                  <td className="py-2 px-2 text-sm">
                    {roundTo(alloc.length)} {unit}
                  </td>
                  <td className="py-2 px-2 text-sm">
                    {tCount('piece', alloc.piecesUsed)}
                  </td>
                  <td className="py-2 px-2 text-sm">
                    {roundTo(alloc.wasteLength)} {unit}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OffcutNote({ testId, children }: { testId: string; children: ReactNode }) {
  return (
    <div className="mt-0.5 text-xs text-gray-500" data-testid={testId}>
      <span aria-hidden="true">↳ </span>
      {children}
    </div>
  )
}

function SummaryCard({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200" data-testid={testId}>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  )
}
