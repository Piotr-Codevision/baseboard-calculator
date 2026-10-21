import { useRef, useState, type FormEvent } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { parseLengthInput } from '../calc/units'

interface QuickAddWallProps {
  unit: string
  onAdd: (length?: number) => void
}

/**
 * "Add Wall" button paired with a length field: typing a length and pressing
 * Enter (or clicking the button) adds a wall of that length, then clears the
 * field and keeps focus on it for rapid entry. With the field empty the
 * button adds a blank row, as before.
 */
export function QuickAddWall({ unit, onAdd }: QuickAddWallProps) {
  const { t } = useLanguage()
  const [value, setValue] = useState('')
  const [invalid, setInvalid] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (value.trim() === '') {
      onAdd()
      return
    }
    const length = parseLengthInput(value)
    if (length === null) {
      setInvalid(true)
      return
    }
    onAdd(length)
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2" noValidate>
      <div>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={`${t('length')} (${unit}) ↵`}
          onChange={(e) => {
            setValue(e.target.value)
            setInvalid(false)
          }}
          className={`w-36 border rounded px-2 py-2 text-sm ${
            invalid ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-label={t('quickAddLength')}
          aria-invalid={invalid}
          aria-describedby={invalid ? 'quick-add-error' : undefined}
          data-testid="quick-add-input"
        />
        {invalid && (
          <p id="quick-add-error" className="mt-1 text-xs text-red-600" role="alert">
            {t('quickAddInvalid')}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-700"
      >
        {t('addWall')}
      </button>
    </form>
  )
}
