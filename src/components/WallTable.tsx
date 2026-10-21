import type { Wall } from '../types'
import { useLanguage } from '../i18n/LanguageContext'

interface WallTableProps {
  walls: Wall[]
  unit: string
  onChange: (id: string, field: keyof Wall, value: string | number) => void
  onDelete: (id: string) => void
}

export function WallTable({ walls, unit, onChange, onDelete }: WallTableProps) {
  const { t } = useLanguage()

  if (walls.length === 0) {
    return (
      <p className="text-gray-500 italic py-4" data-testid="no-walls-message">
        {t('noWalls')}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse" data-testid="wall-table">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-2 px-2 font-semibold text-sm text-gray-600">{t('label')}</th>
            <th className="py-2 px-2 font-semibold text-sm text-gray-600">
              {t('length')} ({unit})
            </th>
            <th className="py-2 px-2 font-semibold text-sm text-gray-600">{t('quantity')}</th>
            <th className="py-2 px-2 font-semibold text-sm text-gray-600">{t('notes')}</th>
            <th className="py-2 px-2 font-semibold text-sm text-gray-600">{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {walls.map((wall) => (
            <tr key={wall.id} className="border-b border-gray-100" data-testid={`wall-row-${wall.id}`}>
              <td className="py-2 px-2">
                <input
                  type="text"
                  value={wall.label}
                  placeholder={t('labelPlaceholder')}
                  onChange={(e) => onChange(wall.id, 'label', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  aria-label={t('label')}
                />
              </td>
              <td className="py-2 px-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={wall.length}
                  onChange={(e) => onChange(wall.id, 'length', parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                  aria-label={t('length')}
                />
              </td>
              <td className="py-2 px-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={wall.quantity}
                  onChange={(e) => onChange(wall.id, 'quantity', parseInt(e.target.value, 10) || 1)}
                  onFocus={(e) => e.target.select()}
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                  aria-label={t('quantity')}
                />
              </td>
              <td className="py-2 px-2">
                <input
                  type="text"
                  value={wall.notes ?? ''}
                  placeholder={t('notesPlaceholder')}
                  onChange={(e) => onChange(wall.id, 'notes', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  aria-label={t('notes')}
                />
              </td>
              <td className="py-2 px-2">
                <button
                  type="button"
                  onClick={() => onDelete(wall.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  aria-label={`${t('delete')} ${wall.label || wall.id}`}
                >
                  {t('delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
