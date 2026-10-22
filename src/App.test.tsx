import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'

function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  window.URL.revokeObjectURL = vi.fn()
  HTMLAnchorElement.prototype.click = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App', () => {
  it('renders the title and default baseboard length', () => {
    renderApp()
    expect(screen.getByText('Baseboard Calculator')).toBeInTheDocument()
    expect(screen.getByLabelText(/Standard baseboard stock length/i)).toHaveValue(240)
  })

  it('adds and deletes wall rows', async () => {
    const user = userEvent.setup()
    renderApp()

    const initialRows = screen.getAllByTestId(/^wall-row-/)
    expect(initialRows).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /Add Wall/i }))
    expect(screen.getAllByTestId(/^wall-row-/)).toHaveLength(2)

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
    await user.click(deleteButtons[0])
    await user.click(screen.getAllByRole('button', { name: /Delete/i })[0])

    expect(screen.getByTestId('no-walls-message')).toBeInTheDocument()
  })

  it('calculates totals for an entered wall and shows summary', async () => {
    const user = userEvent.setup()
    renderApp()

    const lengthInput = screen.getByLabelText('Length')
    await user.clear(lengthInput)
    await user.type(lengthInput, '125')

    await user.click(screen.getByTestId('calculate-button'))

    const summary = screen.getByTestId('summary-dashboard')
    expect(within(summary).getByTestId('summary-stock-required')).toHaveTextContent('1 piece')
    expect(within(summary).getByTestId('summary-total-wall-length')).toHaveTextContent('125 cm')
  })

  it('flags oversized walls that require joined stock pieces', async () => {
    const user = userEvent.setup()
    renderApp()

    const lengthInput = screen.getByLabelText('Length')
    await user.clear(lengthInput)
    await user.type(lengthInput, '500')

    await user.click(screen.getByTestId('calculate-button'))

    expect(screen.getByText(/Requires multiple joined stock pieces/i)).toBeInTheDocument()
  })

  it('shows a validation error for invalid wall length', async () => {
    const user = userEvent.setup()
    renderApp()

    const lengthInput = screen.getByLabelText('Length')
    await user.clear(lengthInput)
    await user.type(lengthInput, '0')

    await user.click(screen.getByTestId('calculate-button'))

    expect(screen.getByTestId('calc-error')).toBeInTheDocument()
  })

  it('converts base length and wall lengths when switching units', async () => {
    const user = userEvent.setup()
    renderApp()

    const lengthInput = screen.getByLabelText('Length')
    await user.clear(lengthInput)
    await user.type(lengthInput, '125')

    await user.selectOptions(screen.getByLabelText('Unit'), 'm')
    expect(screen.getByLabelText(/Standard baseboard stock length/i)).toHaveValue(2.4)
    expect(screen.getByLabelText('Length')).toHaveValue(1.25)

    await user.selectOptions(screen.getByLabelText('Unit'), 'in')
    expect(screen.getByLabelText(/Standard baseboard stock length/i)).toHaveValue(94.4882)
    expect(screen.getByLabelText('Length')).toHaveValue(49.2126)

    await user.selectOptions(screen.getByLabelText('Unit'), 'cm')
    expect(screen.getByLabelText(/Standard baseboard stock length/i)).toHaveValue(240)
    expect(screen.getByLabelText('Length')).toHaveValue(125)
  })

  it('gives the same piece count after switching units', async () => {
    const user = userEvent.setup()
    renderApp()

    const lengthInput = screen.getByLabelText('Length')
    await user.clear(lengthInput)
    await user.type(lengthInput, '125')
    await user.selectOptions(screen.getByLabelText('Unit'), 'm')
    await user.click(screen.getByTestId('calculate-button'))

    const summary = screen.getByTestId('summary-dashboard')
    expect(within(summary).getByTestId('summary-stock-required')).toHaveTextContent('1 piece')
    expect(within(summary).getByTestId('summary-total-wall-length')).toHaveTextContent('1.25 m')
  })

  describe('quick-entry wall length', () => {
    function wallLengthInputs() {
      return screen.getAllByLabelText('Length')
    }

    it('fills the untouched first row, then adds new rows on Enter and keeps focus', async () => {
      const user = userEvent.setup()
      renderApp()

      const quickInput = screen.getByTestId('quick-add-input')
      await user.type(quickInput, '125{Enter}')

      expect(wallLengthInputs()).toHaveLength(1)
      expect(wallLengthInputs()[0]).toHaveValue(125)
      expect(quickInput).toHaveValue('')
      expect(quickInput).toHaveFocus()

      await user.type(quickInput, '310{Enter}')
      await user.type(quickInput, '95{Enter}')

      expect(wallLengthInputs().map((input) => (input as HTMLInputElement).valueAsNumber)).toEqual([
        125, 310, 95,
      ])
      expect(screen.getAllByLabelText('Label').map((input) => (input as HTMLInputElement).value)).toEqual([
        'w1', 'w2', 'w3',
      ])
    })

    it('adds a wall with the typed length when clicking Add Wall', async () => {
      const user = userEvent.setup()
      renderApp()

      await user.type(screen.getAllByLabelText('Label')[0], 'Hall')
      await user.type(screen.getByTestId('quick-add-input'), '200')
      await user.click(screen.getByRole('button', { name: /Add Wall/i }))

      expect(wallLengthInputs()).toHaveLength(2)
      expect(wallLengthInputs()[1]).toHaveValue(200)
      expect(screen.getByTestId('quick-add-input')).toHaveFocus()
    })

    it('accepts a comma as the decimal separator', async () => {
      const user = userEvent.setup()
      renderApp()

      await user.type(screen.getByTestId('quick-add-input'), '2,4{Enter}')

      expect(wallLengthInputs()[0]).toHaveValue(2.4)
    })

    it('rejects invalid input with a hint until the text is corrected', async () => {
      const user = userEvent.setup()
      renderApp()

      const quickInput = screen.getByTestId('quick-add-input')
      await user.type(quickInput, 'abc{Enter}')

      expect(screen.getByText('Enter a positive number')).toBeInTheDocument()
      expect(quickInput).toHaveAttribute('aria-invalid', 'true')
      expect(quickInput).toHaveValue('abc')
      expect(wallLengthInputs()[0]).toHaveValue(0)

      await user.clear(quickInput)
      expect(screen.queryByText('Enter a positive number')).not.toBeInTheDocument()
    })

    it('still adds a blank row when the field is empty', async () => {
      const user = userEvent.setup()
      renderApp()

      await user.click(screen.getByRole('button', { name: /Add Wall/i }))

      expect(wallLengthInputs()).toHaveLength(2)
      expect(wallLengthInputs()[1]).toHaveValue(0)
    })

    it('clears the previous calculation result', async () => {
      const user = userEvent.setup()
      renderApp()

      await user.type(screen.getByTestId('quick-add-input'), '125{Enter}')
      await user.click(screen.getByTestId('calculate-button'))
      expect(screen.getByTestId('summary-dashboard')).toBeInTheDocument()

      await user.type(screen.getByTestId('quick-add-input'), '100{Enter}')
      expect(screen.queryByTestId('summary-dashboard')).not.toBeInTheDocument()
    })
  })

  describe('Clear all', () => {
    async function fillProject(user: ReturnType<typeof userEvent.setup>) {
      const quickInput = screen.getByTestId('quick-add-input')
      await user.type(quickInput, '120{Enter}')
      await user.type(quickInput, '80{Enter}')
      await user.selectOptions(screen.getByLabelText('Unit'), 'm')
      await user.click(screen.getByTestId('calculate-button'))
      await user.type(quickInput, '3')
    }

    it('is disabled while there is nothing to clear', async () => {
      const user = userEvent.setup()
      renderApp()

      const clearButton = screen.getByTestId('clear-all-button')
      expect(clearButton).toBeDisabled()

      await user.type(screen.getByTestId('quick-add-input'), '120{Enter}')
      expect(clearButton).toBeEnabled()
    })

    it('asks for confirmation with Cancel focused, and Cancel keeps everything', async () => {
      const user = userEvent.setup()
      renderApp()
      await fillProject(user)

      await user.click(screen.getByTestId('clear-all-button'))
      const dialog = screen.getByRole('alertdialog', { name: 'Clear the whole project?' })
      expect(dialog).toHaveTextContent('save the project or export the PDF first')
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()

      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(screen.getAllByTestId(/^wall-row-/)).toHaveLength(2)
      expect(screen.getByTestId('summary-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('clear-all-button')).toHaveFocus()
    })

    it('does not clear on Enter, Escape or a click outside the dialog', async () => {
      const user = userEvent.setup()
      renderApp()
      await fillProject(user)

      await user.click(screen.getByTestId('clear-all-button'))
      await user.keyboard('{Enter}')
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

      await user.click(screen.getByTestId('clear-all-button'))
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

      await user.click(screen.getByTestId('clear-all-button'))
      await user.click(screen.getByTestId('confirm-backdrop'))
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

      expect(screen.getAllByTestId(/^wall-row-/)).toHaveLength(2)
      expect(screen.getByTestId('summary-dashboard')).toBeInTheDocument()
    })

    it('keeps keyboard focus inside the dialog', async () => {
      const user = userEvent.setup()
      renderApp()
      await fillProject(user)

      await user.click(screen.getByTestId('clear-all-button'))
      const dialog = screen.getByRole('alertdialog')
      const cancel = within(dialog).getByRole('button', { name: 'Cancel' })
      const confirm = within(dialog).getByRole('button', { name: 'Yes, clear all' })

      await user.tab()
      expect(confirm).toHaveFocus()
      await user.tab()
      expect(cancel).toHaveFocus()
      await user.tab({ shift: true })
      expect(confirm).toHaveFocus()
    })

    it('resets walls, stock length, unit, results and saved data after confirming', async () => {
      const user = userEvent.setup()
      renderApp()
      await fillProject(user)

      await user.click(screen.getByTestId('clear-all-button'))
      await user.click(screen.getByRole('button', { name: 'Yes, clear all' }))

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(screen.getAllByTestId(/^wall-row-/)).toHaveLength(1)
      expect(screen.getByLabelText('Label')).toHaveValue('w1')
      expect(screen.getByLabelText('Length')).toHaveValue(0)
      expect(screen.getByLabelText(/Standard baseboard stock length/i)).toHaveValue(240)
      expect(screen.getByLabelText('Unit')).toHaveValue('cm')
      expect(screen.queryByTestId('summary-dashboard')).not.toBeInTheDocument()
      expect(screen.getByTestId('clear-all-button')).toBeDisabled()

      const quickInput = screen.getByTestId('quick-add-input')
      expect(quickInput).toHaveValue('')
      expect(quickInput).toHaveFocus()

      expect(JSON.parse(window.localStorage.getItem('baseboard-calc-walls')!)).toHaveLength(1)
      expect(window.localStorage.getItem('baseboard-calc-base-length')).toBe('240')
      expect(window.localStorage.getItem('baseboard-calc-unit')).toBe('"cm"')
    })

    it('keeps the chosen language and shows the dialog in Polish', async () => {
      const user = userEvent.setup()
      renderApp()
      await user.selectOptions(screen.getByLabelText(/Language/i), 'pl')
      await user.type(screen.getByTestId('quick-add-input'), '120{Enter}')

      await user.click(screen.getByRole('button', { name: 'Wyczyść wszystko' }))
      expect(screen.getByRole('alertdialog', { name: 'Wyczyścić cały projekt?' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Tak, wyczyść wszystko' }))

      expect(screen.getByText('Kalkulator Listew Przypodłogowych')).toBeInTheDocument()
      expect(screen.getByLabelText('Długość')).toHaveValue(0)
    })
  })

  it('switches language to Polish', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.selectOptions(screen.getByLabelText(/Language/i), 'pl')

    expect(screen.getByText('Kalkulator Listew Przypodłogowych')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dodaj ścianę/i })).toBeInTheDocument()
  })

  it('notes offcut reuse on both the source and the receiving wall', async () => {
    const user = userEvent.setup()
    renderApp()

    const quickInput = screen.getByTestId('quick-add-input')
    await user.type(quickInput, '120{Enter}')
    await user.type(quickInput, '80{Enter}')
    await user.type(quickInput, '200{Enter}')
    await user.click(screen.getByTestId('calculate-button'))

    const [given] = screen.getAllByTestId(/^offcut-given-/)
    const [received] = screen.getAllByTestId(/^offcut-received-/)
    expect(screen.getAllByTestId(/^offcut-given-/)).toHaveLength(1)
    expect(screen.getAllByTestId(/^offcut-received-/)).toHaveLength(1)
    expect(given).toHaveTextContent('Offcut reused for: w2 (80 cm)')
    expect(received).toHaveTextContent('Cut from offcut of: w1')

    const [w1Row, w2Row, w3Row] = screen.getAllByTestId(/^breakdown-row-/)
    expect(w1Row).toContainElement(given)
    expect(w2Row).toContainElement(received)
    expect(within(w3Row).queryByTestId(/^offcut-/)).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/Language/i), 'pl')
    expect(given).toHaveTextContent('Odpad użyty dla: w2 (80 cm)')
    expect(received).toHaveTextContent('Wycięte z odpadu ściany: w1')
  })

  it('inflects piece counts in Polish', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.selectOptions(screen.getByLabelText(/Language/i), 'pl')
    const lengthInput = screen.getByLabelText('Długość')
    await user.clear(lengthInput)
    await user.type(lengthInput, '500')
    await user.click(screen.getByTestId('calculate-button'))

    expect(screen.getByTestId('summary-stock-required')).toHaveTextContent('3 sztuki')
    const [row] = screen.getAllByTestId(/^breakdown-row-/)
    expect(row).toHaveTextContent('3 sztuki')
  })

  it('saves the project to a downloadable JSON file', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByTestId('save-button'))

    expect(window.URL.createObjectURL).toHaveBeenCalled()
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled()
  })

  it('loads a project from a valid JSON file', async () => {
    const user = userEvent.setup()
    renderApp()

    const project = {
      version: 1,
      savedAt: new Date().toISOString(),
      baseLength: 300,
      unit: 'm',
      walls: [{ id: 'x1', label: 'Loaded Wall', length: 42, quantity: 3, notes: '' }],
    }
    const file = new File([JSON.stringify(project)], 'project.json', {
      type: 'application/json',
    })

    const input = screen.getByTestId('load-file-input')
    await user.upload(input, file)

    expect(await screen.findByDisplayValue('Loaded Wall')).toBeInTheDocument()
    expect(screen.getByLabelText(/Standard baseboard stock length/i)).toHaveValue(300)
    expect(screen.getByLabelText('Length')).toHaveValue(42)
    expect(screen.getByLabelText('Qty')).toHaveValue(3)
  })

  it('shows a load error for an invalid project file', async () => {
    const user = userEvent.setup()
    renderApp()

    const file = new File(['not valid json'], 'bad.json', { type: 'application/json' })
    const input = screen.getByTestId('load-file-input')
    await user.upload(input, file)

    expect(await screen.findByTestId('load-error')).toBeInTheDocument()
  })

  it('exports a PDF report without throwing', async () => {
    const user = userEvent.setup()
    renderApp()

    const lengthInput = screen.getByLabelText('Length')
    await user.clear(lengthInput)
    await user.type(lengthInput, '125')

    await user.click(screen.getByTestId('export-pdf-button'))

    expect(screen.queryByTestId('calc-error')).not.toBeInTheDocument()
    expect(screen.getByTestId('summary-dashboard')).toBeInTheDocument()
  })
})
