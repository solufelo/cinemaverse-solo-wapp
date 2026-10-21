import { useState } from 'react'
import { Bookmark, Check, Play, RotateCcw, ScanLine, X } from 'lucide-react'
import { STATUS_LABELS } from '../../shared/constants.ts'
import { ratingWord } from '../lib/format'
import { imageUrl } from '../lib/tmdb'

export const STATUS_STYLES = {
  watching: { text: 'text-neon', bg: 'bg-neon', ring: 'border-neon/50 bg-neon/10', bar: '#00f5ff', icon: Play },
  completed: { text: 'text-acid', bg: 'bg-acid', ring: 'border-acid/50 bg-acid/10', bar: '#b8ff00', icon: Check },
  planned: { text: 'text-plasma', bg: 'bg-plasma', ring: 'border-plasma/50 bg-plasma/10', bar: '#ff2d95', icon: Bookmark },
  dropped: { text: 'text-ember', bg: 'bg-ember', ring: 'border-ember/50 bg-ember/10', bar: '#ff6b5b', icon: X },
}

/**
 * Status marker. Colour alone is not enough at 8px (queued pink vs dropped coral), so each
 * status also has its own shape: play, solid square, ring, cross. Inherits currentColor.
 */
export function StatusMark({ status, className = '' }) {
  const shape = {
    watching: <path d="M1.5 0.8 8 5l-6.5 4.2z" fill="currentColor" />,
    completed: <rect x="1" y="1" width="8" height="8" fill="currentColor" />,
    planned: <circle cx="5" cy="5" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.8" />,
    dropped: <path d="m1.6 1.6 6.8 6.8m0-6.8L1.6 8.4" stroke="currentColor" strokeWidth="1.9" />,
  }[status]
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" className={`h-2 w-2 shrink-0 ${className}`}>
      {shape}
    </svg>
  )
}

/** Status as a HUD readout: shaped marker + mono caps. `boxed` adds a plate for use over imagery. */
export function StatusChip({ status, boxed = false, className = '' }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.planned
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10.5px] font-medium uppercase leading-none tracking-[0.14em] ${s.text} ${
        boxed ? 'rounded-[3px] bg-void/85 px-2 py-1.5 backdrop-blur' : ''
      } ${className}`}
    >
      <StatusMark status={status} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

const POSTER_DIMS = { w92: [92, 138], w185: [185, 278], w342: [342, 513], w500: [500, 750] }

/** Poster that fades in on load, with a designed fallback when TMDB has no image or it fails. */
export function Poster({ path, title, size = 'w342', className = '', eager = false, priority = false }) {
  const src = imageUrl(path, size)
  const [state, setState] = useState('loading')
  if (!src || state === 'error') {
    return (
      <div
        className={`relative flex aspect-[2/3] flex-col justify-between overflow-hidden bg-gradient-to-br from-raised to-void p-3 ${className}`}
        role="img"
        aria-label={title}
      >
        <span className="h-2 w-2 bg-neon/60" aria-hidden="true" />
        <span className="line-clamp-3 font-display text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-400">{title}</span>
      </div>
    )
  }
  const [w, h] = POSTER_DIMS[size] || POSTER_DIMS.w342
  return (
    <img
      src={src}
      alt={title}
      width={w}
      height={h}
      loading={eager || priority ? 'eager' : 'lazy'}
      fetchpriority={priority ? 'high' : undefined}
      decoding="async"
      onLoad={() => setState('ok')}
      onError={() => setState('error')}
      className={`aspect-[2/3] bg-raised object-cover ${state === 'ok' ? '' : 'img-wait'} ${className}`}
    />
  )
}

/** Gradient avatar derived from the player's hue: no uploads, no external requests. */
export function Avatar({ user, size = 36, className = '' }) {
  const hue = user?.avatarHue ?? 190
  const initials = (user?.displayName || user?.username || '?')
    .split(/[\s_.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-sans font-bold leading-none text-void ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9.5, size * 0.38),
        background: `linear-gradient(135deg, hsl(${hue} 95% 64%), hsl(${(hue + 55) % 360} 90% 54%))`,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

export function KindTag({ kind }) {
  if (kind !== 'demo' && kind !== 'guest') return null
  return (
    <span
      title={kind === 'demo' ? 'Fictional demo player' : 'Guest account (expires after 24 hours)'}
      className="rounded-[3px] border border-white/15 px-1.5 py-[3px] font-mono text-[9px] uppercase leading-none tracking-[0.16em] text-muted"
    >
      {kind}
    </span>
  )
}

/** A 10-segment "health bar" rating, on brand with the HUD look. */
export function RatingBar({ rating, className = '' }) {
  if (!rating) return null
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label={`Rated ${rating} out of 10`}>
      <span className="flex gap-[2px]" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`h-2.5 w-[5px] ${i < rating ? 'bg-acid' : 'bg-white/[0.12]'}`} />
        ))}
      </span>
      <span className="font-mono text-[12px] font-semibold tabular-nums text-acid">{rating}/10</span>
    </span>
  )
}

/** Ten tappable segments with a hover preview and a big readout. */
export function RatingInput({ value, onChange, id, compact = false }) {
  const [hover, setHover] = useState(null)
  const shown = hover ?? value
  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
      <div className="flex flex-1 gap-[3px]" role="radiogroup" aria-labelledby={id} onMouseLeave={() => setHover(null)}>
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1
          const on = shown && n <= shown
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} out of 10`}
              onMouseEnter={() => setHover(n)}
              onClick={() => onChange(value === n ? null : n)}
              className={`group/seg relative flex-1 ${compact ? 'h-8' : 'h-10'} min-w-0`}
            >
              <span
                className={`absolute inset-x-0 bottom-0 transition-all duration-200 ease-out ${
                  on ? `bg-acid ${hover ? 'opacity-80' : ''}` : 'bg-white/[0.1] group-hover/seg:bg-white/25'
                }`}
                style={{ top: compact ? `${Math.max(0, 40 - n * 4)}%` : `${Math.max(0, 45 - n * 4.5)}%` }}
              />
            </button>
          )
        })}
      </div>
      <div className={`shrink-0 text-right ${compact ? 'w-12' : 'w-24'}`} aria-live="polite">
        <span className={`t-num ${compact ? 'text-base' : 'text-2xl'} ${shown ? 'text-acid' : 'text-slate-600'}`}>
          {shown ?? '—'}
          {shown ? <span className="text-[0.55em] text-muted">/10</span> : null}
        </span>
        {compact ? null : <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{ratingWord(shown)}</span>}
      </div>
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

/** Empty state: a hairline HUD frame with a target reticle. Every list in the app uses it. */
export function EmptyState({ icon: Icon = ScanLine, label = 'No signal', title, children, action, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-[4px] border border-white/[0.09] bg-white/[0.015] px-6 py-14 text-center sm:py-16 ${className}`}>
      <div aria-hidden="true" className="grid-bg pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(closest-side,black,transparent)]" />
      <div className="relative">
        <span className="hud-corners mx-auto mb-6 flex h-14 w-14 items-center justify-center" style={{ '--inset': '0px', '--corner': 'rgba(0,245,255,.7)', '--corner-len': '10px' }}>
          <Icon className="h-5 w-5 text-neon" strokeWidth={1.75} />
        </span>
        <p className="hud-label justify-center">{label}</p>
        <h3 className="t-h3 mt-3 sm:text-2xl">{title}</h3>
        {children ? <p className="mx-auto mt-3 max-w-md text-muted">{children}</p> : null}
        {action ? <div className="mt-7 flex flex-wrap justify-center gap-3">{action}</div> : null}
      </div>
    </div>
  )
}

export function ErrorState({ error, onRetry, title = "Couldn't load this" }) {
  return (
    <div role="alert" className="relative overflow-hidden rounded-[4px] border border-ember/25 bg-ember/[0.03] px-6 py-12 text-center">
      <span className="hud-corners mx-auto mb-6 flex h-14 w-14 items-center justify-center" style={{ '--inset': '0px', '--corner': 'rgba(255,107,91,.8)', '--corner-len': '10px' }}>
        <span className="font-display text-lg font-black text-ember">!</span>
      </span>
      <p className="hud-label justify-center" style={{ '--mark': '#ff6b5b' }}>
        Signal lost
      </p>
      <h3 className="t-h3 mt-3">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-muted">{error?.message || 'Something went wrong.'}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-ghost btn-sm mt-6">
          <RotateCcw className="h-3.5 w-3.5" /> Try again
        </button>
      ) : null}
    </div>
  )
}

/** Compact empty state for side columns: same frame and reticle as EmptyState, one line of copy. */
export function MiniEmpty({ icon: Icon = ScanLine, children, action }) {
  return (
    <div className="flex items-center gap-4 rounded-[4px] border border-white/[0.09] bg-white/[0.015] p-4">
      <span className="hud-corners flex h-10 w-10 shrink-0 items-center justify-center" style={{ '--inset': '0px', '--corner': 'rgba(0,245,255,.7)', '--corner-len': '7px' }}>
        <Icon className="h-4 w-4 text-neon" strokeWidth={1.75} />
      </span>
      <p className="min-w-0 flex-1 text-[14.5px] leading-snug text-muted">{children}</p>
      {action}
    </div>
  )
}

/** Section header: HUD label, display title, optional aside (link or controls). */
export function SectionHead({ label, title, children, aside, id, className = '' }) {
  return (
    <div className={`mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mb-10 ${className}`}>
      <div className="min-w-0">
        {label ? <p className="hud-label mb-4">{label}</p> : null}
        <h2 id={id} className="t-h2">
          {title}
        </h2>
        {children ? <p className="mt-3 max-w-xl text-muted">{children}</p> : null}
      </div>
      {aside}
    </div>
  )
}

