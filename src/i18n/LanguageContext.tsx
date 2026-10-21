import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  formatCount,
  translations,
  type Language,
  type PluralNoun,
  type TranslationKey,
} from './translations'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
  /** Count with the inflected noun in the current language, e.g. "4 sztuki". */
  tCount: (noun: PluralNoun, count: number) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const STORAGE_KEY = 'baseboard-calc-language'

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'pl' || stored === 'en' ? stored : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    window.localStorage.setItem(STORAGE_KEY, lang)
  }, [])

  const t = useCallback(
    (key: TranslationKey) => translations[language][key],
    [language],
  )

  const tCount = useCallback(
    (noun: PluralNoun, count: number) => formatCount(language, noun, count),
    [language],
  )

  const value = useMemo(
    () => ({ language, setLanguage, t, tCount }),
    [language, setLanguage, t, tCount],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}
