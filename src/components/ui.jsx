import { Link } from 'react-router-dom'
import { Film, RotateCcw, TriangleAlert } from 'lucide-react'
import { STATUS_LABELS } from '../../shared/constants.ts'
import { imageUrl } from '../lib/tmdb'

export const STATUS_STYLES = {
  watching: { text: 'text-neon', bg: 'bg-neon', ring: 'border-neon/40 bg-neon/10', bar: '#00f5ff' },
  completed: { text: 'text-acid', bg: 'bg-acid', ring: 'border-acid/40 bg-acid/10', bar: '#b8ff00' },
  planned: { text: 'text-plasma', bg: 'bg-plasma', ring: 'border-plasma/40 bg-plasma/10', bar: '#ff2d95' },
  dropped: { text: 'text-ember', bg: 'bg-ember', ring: 'border-ember/40 bg-ember/10', bar: '#ff6b5b' },
}

export function StatusChip({ status, className = '' }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.planned
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] ${s.ring} ${s.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.bg}`} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

/** Poster with a styled fallback when TMDB has no image. */
export function Poster({ path, title, size = 'w342', className = '', eager = false }) {
  const src = imageUrl(path, size)
  if (!src) {
    return (
      <div
        className={`flex aspect-[2/3] flex-col items-center justify-center gap-2 bg-gradient-to-br from-raised to-void p-2 text-center ${className}`}
        role="img"
        aria-label={title}
      >
        <Film className="h-6 w-6 text-neon/50" />
        <span className="line-clamp-3 font-display text-[10px] uppercase tracking-wider text-muted">{title}</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={title}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`aspect-[2/3] bg-raised object-cover ${className}`}
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
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-void ring-2 ring-void ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.36),
        background: `linear-gradient(135deg, hsl(${hue} 95% 62%), hsl(${(hue + 55) % 360} 90% 55%))`,
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
      title={kind === 'demo' ? 'Seeded demo player' : 'Guest account (expires after 24 hours)'}
      className="rounded border border-white/15 px-1.5 py-px font-display text-[9px] uppercase tracking-[0.2em] text-muted"
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
      <span className="flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`h-2.5 w-1.5 rounded-[1px] ${i < rating ? 'bg-acid shadow-[0_0_6px_rgba(184,255,0,0.6)]' : 'bg-white/10'}`} />
        ))}
      </span>
      <span className="font-display text-xs font-bold text-acid">{rating}/10</span>
    </span>
  )
}

export function RatingInput({ value, onChange, id }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1" role="radiogroup" aria-labelledby={id}>
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1
          const on = value && n <= value
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} out of 10`}
              onClick={() => onChange(value === n ? null : n)}
              className={`h-7 w-[18px] rounded-sm transition sm:w-5 ${on ? 'bg-acid shadow-[0_0_8px_rgba(184,255,0,0.55)]' : 'bg-white/10 hover:bg-white/25'}`}
            />
          )
        })}
      </div>
      <span className="min-w-14 font-display text-sm font-bold text-acid">{value ? `${value}/10` : <span className="text-muted">—</span>}</span>
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function EmptyState({ icon: Icon = Film, title, children, action }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-neon/30 bg-neon/10">
        <Icon className="h-5 w-5 text-neon" />
      </span>
      <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">{title}</h3>
      {children ? <p className="mt-2 max-w-md text-muted">{children}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ error, onRetry, title = "Couldn't load this" }) {
  return (
    <div role="alert" className="panel flex flex-col items-center border-ember/30 px-6 py-10 text-center">
      <TriangleAlert className="mb-3 h-6 w-6 text-ember" />
      <h3 className="font-display text-base font-bold uppercase tracking-wide text-white">{title}</h3>
      <p className="mt-2 max-w-md text-muted">{error?.message || 'Something went wrong.'}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-quiet btn-sm mt-5">
          <RotateCcw className="h-3.5 w-3.5" /> Try again
        </button>
      ) : null}
    </div>
  )
}

export function PlayerLink({ user, className = '' }) {
  return (
    <Link to={`/u/${user.username}`} className={`group inline-flex min-w-0 items-center gap-2 ${className}`}>
      <Avatar user={user} size={28} />
      <span className="truncate font-semibold text-ink group-hover:text-neon">{user.displayName}</span>
      <span className="hidden truncate text-sm text-muted sm:inline">@{user.username}</span>
    </Link>
  )
}
