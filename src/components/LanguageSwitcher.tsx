import { useLanguage } from '../i18n/LanguageContext'
import type { Language } from '../i18n/translations'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="text-sm text-gray-600">
        {t('language')}
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="border border-gray-300 rounded px-2 py-1 text-sm"
      >
        <option value="en">English</option>
        <option value="pl">Polski</option>
      </select>
    </div>
  )
}
