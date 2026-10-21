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
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:items-end sm:pr-6 md:pb-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto relative flex w-full max-w-sm animate-rise items-start gap-3 overflow-hidden rounded-lg border border-white/10 bg-raised/95 py-3.5 pl-4 pr-3 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl`}
          >
            <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-[3px] ${t.tone === 'error' ? 'bg-ember' : 'bg-acid'}`} />
            {t.tone === 'error' ? (
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
            )}
            <div className="min-w-0 flex-1 text-[15px] leading-snug text-ink">
              {t.message}
              {t.link ? (
                <Link to={t.link.to} className="mt-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-neon hover:underline">
                  {t.link.label} →
                </Link>
              ) : null}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-m-1 rounded p-1 text-muted transition hover:text-white">
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
