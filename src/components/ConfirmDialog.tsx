import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

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
 * backdrop also cancels.
 *
 * While open, the rest of the page is made `inert` (hidden from screen
 * readers, unclickable and unfocusable) and does not scroll; Escape and Tab
 * are handled at document level so they keep working even when focus has
 * drifted off the buttons. On close, focus returns to the element that
 * opened the dialog unless something else has claimed it.
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
  const backdropRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  // True only when the current click started on the backdrop itself, so a
  // drag from inside the dialog out onto the backdrop does not cancel.
  const pressStartedOnBackdrop = useRef(false)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  // Layout effect: the page must be interactive again before anything that
  // mounts in the same commit (e.g. an autoFocus field) tries to take focus.
  useLayoutEffect(() => {
    const backdrop = backdropRef.current
    const opener = document.activeElement as HTMLElement | null
    const madeInert: Element[] = []
    for (const el of Array.from(document.body.children)) {
      if (el !== backdrop && !el.hasAttribute('inert')) {
        el.setAttribute('inert', '')
        madeInert.push(el)
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()

    return () => {
      madeInert.forEach((el) => el.removeAttribute('inert'))
      document.body.style.overflow = previousOverflow
      const active = document.activeElement
      const focusIsUnclaimed =
        !active || active === document.body || (backdrop?.contains(active) ?? false)
      if (focusIsUnclaimed && opener && opener !== document.body) opener.focus()
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancelRef.current()
      } else if (e.key === 'Tab') {
        // Two buttons only: Tab / Shift+Tab cycle between them, and pull
        // focus back in if it has drifted elsewhere.
        e.preventDefault()
        const next = document.activeElement === cancelRef.current ? confirmRef : cancelRef
        next.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4"
      onMouseDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (pressStartedOnBackdrop.current && e.target === e.currentTarget) onCancel()
        pressStartedOnBackdrop.current = false
      }}
      data-testid="confirm-backdrop"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl outline-none"
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
    </div>,
    document.body,
  )
}
