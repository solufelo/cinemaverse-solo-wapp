import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, TriangleAlert, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const seq = useRef(0)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback(
    (toast) => {
      const id = ++seq.current
      setToasts((t) => [...t.slice(-2), { id, tone: 'ok', ...toast }])
      setTimeout(() => dismiss(id), toast.tone === 'error' ? 7000 : 4500)
    },
    [dismiss],
  )
  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end sm:pr-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-xl border bg-raised/95 px-4 py-3 shadow-card backdrop-blur ${
              t.tone === 'error' ? 'border-ember/40' : 'border-neon/30'
            }`}
          >
            {t.tone === 'error' ? (
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-ember" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-acid" />
            )}
            <div className="min-w-0 flex-1 text-[15px] text-ink">
              {t.message}
              {t.link ? (
                <Link to={t.link.to} className="ml-2 font-semibold text-neon hover:underline">
                  {t.link.label}
                </Link>
              ) : null}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
