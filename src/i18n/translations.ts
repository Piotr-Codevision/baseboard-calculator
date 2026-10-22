export type Language = 'en' | 'pl'

export const translations = {
  en: {
    appTitle: 'Baseboard Calculator',
    appSubtitle: 'Calculate the minimum stock baseboards needed for your project.',
    baseboardConfig: 'Baseboard Configuration',
    stockLength: 'Standard baseboard stock length',
    unit: 'Unit',
    walls: 'Walls',
    addWall: 'Add Wall',
    label: 'Label',
    length: 'Length',
    quantity: 'Qty',
    notes: 'Notes',
    actions: 'Actions',
    delete: 'Delete',
    labelPlaceholder: 'e.g. Living Room - North Wall',
    notesPlaceholder: 'Optional notes',
    calculate: 'Calculate',
    summary: 'Summary',
    totalWallLength: 'Total wall length',
    totalStockRequired: 'Total baseboard stock required',
    wastePercentage: 'Estimated waste',
    breakdown: 'Breakdown per wall',
    piecesColumn: 'Pieces',
    waste: 'Waste',
    oversizedWarning: 'Requires multiple joined stock pieces (exceeds stock length)',
    offcutReceivedFrom: 'Cut from offcut of',
    offcutGivenTo: 'Offcut reused for',
    noWalls: 'No walls added yet. Click "Add Wall" to get started.',
    language: 'Language',
    validationError: 'Validation error',
    save: 'Save',
    load: 'Load',
    exportPdf: 'Export PDF',
    clearAll: 'Clear all',
    clearAllTitle: 'Clear the whole project?',
    clearAllMessage:
      'All walls and results will be removed, and the stock length and unit reset to 240 cm. This cannot be undone — save the project or export the PDF first if you may need it again.',
    clearAllConfirm: 'Yes, clear all',
    cancel: 'Cancel',
    loadError: 'Load error',
    saveLoadTitle: 'Project File',
    generatedOn: 'Generated on',
    oversizedNoteShort: 'requires joined stock pieces',
    page: 'Page',
    quickAddLength: 'Length of new wall',
    quickAddInvalid: 'Enter a positive number',
  },
  pl: {
    appTitle: 'Kalkulator Listew Przypodłogowych',
    appSubtitle: 'Oblicz minimalną liczbę listew potrzebnych do Twojego projektu.',
    baseboardConfig: 'Konfiguracja listwy',
    stockLength: 'Standardowa długość listwy',
    unit: 'Jednostka',
    walls: 'Ściany',
    addWall: 'Dodaj ścianę',
    label: 'Nazwa',
    length: 'Długość',
    quantity: 'Ilość',
    notes: 'Notatki',
    actions: 'Akcje',
    delete: 'Usuń',
    labelPlaceholder: 'np. Salon - ściana północna',
    notesPlaceholder: 'Opcjonalne notatki',
    calculate: 'Oblicz',
    summary: 'Podsumowanie',
    totalWallLength: 'Łączna długość ścian',
    totalStockRequired: 'Wymagana liczba listew',
    wastePercentage: 'Szacowany odpad',
    breakdown: 'Zestawienie dla każdej ściany',
    piecesColumn: 'Sztuki',
    waste: 'Odpad',
    oversizedWarning: 'Wymaga łączenia kilku listew (przekracza długość listwy)',
    offcutReceivedFrom: 'Wycięte z odpadu ściany',
    offcutGivenTo: 'Odpad użyty dla',
    noWalls: 'Brak dodanych ścian. Kliknij "Dodaj ścianę", aby rozpocząć.',
    language: 'Język',
    validationError: 'Błąd walidacji',
    save: 'Zapisz',
    load: 'Wczytaj',
    exportPdf: 'Eksportuj PDF',
    clearAll: 'Wyczyść wszystko',
    clearAllTitle: 'Wyczyścić cały projekt?',
    clearAllMessage:
      'Wszystkie ściany i wyniki zostaną usunięte, a długość listwy i jednostka wrócą do 240 cm. Tej operacji nie można cofnąć — jeśli projekt może być jeszcze potrzebny, najpierw go zapisz lub wyeksportuj PDF.',
    clearAllConfirm: 'Tak, wyczyść wszystko',
    cancel: 'Anuluj',
    loadError: 'Błąd wczytywania',
    saveLoadTitle: 'Plik projektu',
    generatedOn: 'Wygenerowano',
    oversizedNoteShort: 'wymaga łączenia listew',
    page: 'Strona',
    quickAddLength: 'Długość nowej ściany',
    quickAddInvalid: 'Wpisz liczbę dodatnią',
  },
} as const

export type TranslationKey = keyof typeof translations.en

export type PluralNoun = 'piece'

/** Word forms per CLDR plural category; `other` is the required fallback. */
type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }

/**
 * Count-dependent nouns. Polish has three integer forms: "one" (1 sztuka),
 * "few" (2–4, 22–24, … sztuki) and "many" (0, 5–21, 25–31, … sztuk); "other"
 * covers fractions (1,5 sztuki).
 */
export const pluralForms: Record<Language, Record<PluralNoun, PluralForms>> = {
  en: {
    piece: { one: 'piece', other: 'pieces' },
  },
  pl: {
    piece: { one: 'sztuka', few: 'sztuki', many: 'sztuk', other: 'sztuki' },
  },
}

/** Formats a count with the correctly inflected noun, e.g. "4 sztuki". */
export function formatCount(language: Language, noun: PluralNoun, count: number): string {
  const forms = pluralForms[language][noun]
  const category = new Intl.PluralRules(language).select(count)
  return `${count} ${forms[category] ?? forms.other}`
}
