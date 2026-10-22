import { useEffect, useId, useRef, type KeyboardEvent } from 'react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal confirmation for destructive actions. Cancel is focused when it
 * opens, so Enter or Escape never confirms by accident; clicking the
 * backdrop also cancels. Focus stays inside the dialog while it is open.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const messageId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    } else if (e.key === 'Tab') {
      // Two buttons only: keep Tab / Shift+Tab cycling between them.
      e.preventDefault()
      const next = document.activeElement === cancelRef.current ? confirmRef : cancelRef
      next.current?.focus()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      data-testid="confirm-backdrop"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <p id={messageId} className="mt-2 text-sm text-gray-600">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="border border-gray-300 rounded px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="bg-red-600 text-white rounded px-4 py-2 text-sm font-semibold hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
