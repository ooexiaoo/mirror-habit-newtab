import { useEffect } from 'react'
import { CircleAlert, Undo2, X } from 'lucide-react'

export interface ToastData {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
  tone?: 'default' | 'error'
}

export function Toast({ toast, onDismiss }: { toast: ToastData | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => onDismiss(), toast.tone === 'error' ? 7000 : 5200)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null

  return (
    <div className="toast-wrap" aria-live="polite" aria-atomic="true">
      <div className="toast" data-tone={toast.tone ?? 'default'} role="status">
        <span className="toast__icon" aria-hidden="true">
          <CircleAlert size={15} strokeWidth={1.9} />
        </span>
        <span className="toast__message">{toast.message}</span>
        {toast.actionLabel && toast.onAction ? (
          <button
            type="button"
            className="toast__action"
            onClick={() => {
              toast.onAction?.()
              onDismiss()
            }}
          >
            <Undo2 size={13} strokeWidth={1.9} aria-hidden="true" />
            {toast.actionLabel}
          </button>
        ) : null}
        <button type="button" className="toast__close" onClick={onDismiss} aria-label="Dismiss message">
          <X size={13} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
