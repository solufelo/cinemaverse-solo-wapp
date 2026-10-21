import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Trash2 } from 'lucide-react'
import { STATUS_VERBS } from '../../shared/constants.ts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/api'
import { timeAgo } from '../lib/format'
import { Avatar, KindTag, Poster, RatingBar, STATUS_STYLES, Skeleton, StatusChip } from './ui'

function useLike(item) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [like, setLike] = useState({ likes: item.likes, likedByMe: item.likedByMe })
  const [burst, setBurst] = useState(0)

  async function toggle() {
    if (!user) {
      navigate('/login', { state: { from: '/feed' } })
      return
    }
    const prev = like
    const next = { likes: prev.likes + (prev.likedByMe ? -1 : 1), likedByMe: !prev.likedByMe }
    setLike(next)
    if (next.likedByMe) setBurst((b) => b + 1)
    try {
      setLike(await api(`/feed/${item.id}/like`, { method: prev.likedByMe ? 'DELETE' : 'POST' }))
    } catch (err) {
      setLike(prev)
      toast.push({ tone: 'error', message: err.message })
    }
  }
  return { like, burst, toggle }
}

function LikeButton({ item }) {
  const { like, burst, toggle } = useLike(item)
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={like.likedByMe}
      aria-label={like.likedByMe ? 'Unlike' : 'Like'}
      className={`-ml-2 inline-flex h-10 items-center gap-2 rounded-full px-2.5 font-mono text-[12px] transition active:scale-95 ${
        like.likedByMe ? 'text-plasma' : 'text-muted hover:text-plasma'
      }`}
    >
      <Heart key={burst} className={`h-[18px] w-[18px] ${like.likedByMe ? 'animate-pop fill-plasma' : ''}`} strokeWidth={1.75} />
      <span className="min-w-[1ch] tabular-nums">{like.likes || ''}</span>
    </button>
  )
}

function useRemove(item, onRemoved) {
  const { user } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const canDelete = user && (user.username === item.user.username || user.role === 'admin')
  async function remove() {
    setBusy(true)
    try {
      await api(`/feed/${item.id}`, { method: 'DELETE' })
      onRemoved?.(item.id)
      toast.push({ message: 'Post removed from the feed.' })
    } catch (err) {
      toast.push({ tone: 'error', message: err.message })
      setBusy(false)
    }
  }
  return { canDelete, busy, remove }
}

/**
 * Feed entry. Two densities give the feed a rhythm: a post with a take gets the poster and a
 * pull quote; a bare status change is a one-line log entry.
 */
export default function ActivityCard({ item, onRemoved, compact = false }) {
  if (compact) return <CompactActivity item={item} />
  return item.note ? <TakeEntry item={item} onRemoved={onRemoved} /> : <LogLine item={item} onRemoved={onRemoved} />
}

function Stamp({ iso, className = '' }) {
  return (
    <time dateTime={iso} title={new Date(iso).toLocaleString()} className={`shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] text-muted ${className}`}>
      {timeAgo(iso)}
    </time>
  )
}

function DeleteButton({ item, onRemoved }) {
  const { canDelete, busy, remove } = useRemove(item, onRemoved)
  if (!canDelete) return null
  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-ember/10 hover:text-ember"
      aria-label="Delete post"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}

/** Who posted: avatar, name, demo/guest tag. Same line on both row types. */
function Byline({ user }) {
  return (
    <p className="flex min-w-0 items-center gap-2 text-[14px]">
      <Link to={`/u/${user.username}`} className="group/player flex min-w-0 items-center gap-2 py-0.5">
        <Avatar user={user} size={22} />
        <span className="truncate font-semibold text-slate-200 transition group-hover/player:text-neon">{user.displayName}</span>
      </Link>
      <KindTag kind={user.kind} />
    </p>
  )
}

/** Time, like and delete: always the top-right cluster, so the heart never moves between rows. */
function RowActions({ item, onRemoved }) {
  return (
    <div className="flex flex-col items-end gap-0.5 self-start sm:-mt-[7px] sm:flex-row sm:items-center sm:gap-2">
      <Stamp iso={item.createdAt} className="pt-1 sm:mr-1 sm:pt-0" />
      <span className="flex items-center">
        <LikeButton item={item} />
        <DeleteButton item={item} onRemoved={onRemoved} />
      </span>
    </div>
  )
}

function Headline({ item, logHref, size }) {
  const s = STATUS_STYLES[item.status]
  return (
    <h3 className="mt-1.5 flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span className={`shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] ${s?.text}`}>{STATUS_VERBS[item.status]}</span>
      <Link to={logHref} className={`t-film leading-tight transition hover:text-neon ${size}`}>
        {item.film.title}
      </Link>
      {item.film.releaseYear ? <span className="font-mono text-[12px] text-muted">{item.film.releaseYear}</span> : null}
      <RatingBar rating={item.rating} className="sm:ml-1" />
    </h3>
  )
}

/** A post with a take: the same header line as a log entry, plus the poster and the take. */
function TakeEntry({ item, onRemoved }) {
  const logHref = `/log?film=${item.film.tmdbId}`
  const accent = STATUS_STYLES[item.status]?.bar

  return (
    <article className="group relative grid grid-cols-[56px_1fr_auto] gap-x-4 border-b border-white/[0.07] py-6 sm:grid-cols-[88px_1fr_auto] sm:gap-x-6 sm:py-7" data-reveal>
      <Link to={logHref} className="relative block self-start sm:row-span-2" aria-label={`Log ${item.film.title}`}>
        <span className="lock-on hud-corners block" style={{ '--inset': '-5px', '--corner-len': '10px' }}>
          <Poster path={item.film.posterPath} title={item.film.title} size="w185" className="w-full rounded-[4px] ring-1 ring-white/10 transition duration-500 ease-out group-hover:brightness-110" />
        </span>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] rounded-b-[4px]" style={{ background: accent }} />
      </Link>

      <div className="min-w-0">
        <Byline user={item.user} />
        <Headline item={item} logHref={logHref} size="text-[16px] sm:text-[18px]" />
      </div>
      <RowActions item={item} onRemoved={onRemoved} />

      {/* The take is the content: full width under the row on phones, beside the poster on wider screens. */}
      <blockquote className="col-span-3 mt-4 border-l-2 pl-4 sm:col-span-2 sm:col-start-2 sm:mt-3 sm:pl-5" style={{ borderColor: accent }}>
        <p className="max-w-[46ch] text-[17px] font-medium leading-[1.45] text-white sm:text-[19px]">{item.note}</p>
      </blockquote>
    </article>
  )
}

/** A status change without a take: one line, small poster, status verb in its colour. */
function LogLine({ item, onRemoved }) {
  const logHref = `/log?film=${item.film.tmdbId}`
  const s = STATUS_STYLES[item.status]
  return (
    <article className="group relative grid grid-cols-[56px_1fr_auto] items-start gap-x-4 border-b border-white/[0.07] py-5 sm:grid-cols-[88px_1fr_auto] sm:gap-x-6" data-reveal>
      <Link to={logHref} className="relative block w-11 sm:w-14" aria-label={`Log ${item.film.title}`}>
        <Poster path={item.film.posterPath} title={item.film.title} size="w92" className="w-full rounded-[3px] ring-1 ring-white/10 transition duration-300 group-hover:ring-white/30" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: s?.bar }} />
      </Link>
      <div className="min-w-0">
        <Byline user={item.user} />
        <Headline item={item} logHref={logHref} size="text-[16px] sm:text-[17px]" />
      </div>
      <RowActions item={item} onRemoved={onRemoved} />
    </article>
  )
}

/** Profile timeline row: thumb, verb, film, rating, take. */
function CompactActivity({ item }) {
  const s = STATUS_STYLES[item.status]
  return (
    <article className="group relative flex gap-4 py-4">
      <Link to={`/log?film=${item.film.tmdbId}`} className="shrink-0" aria-label={`Log ${item.film.title}`}>
        <Poster path={item.film.posterPath} title={item.film.title} size="w92" className="w-12 rounded-[3px] ring-1 ring-white/10 transition group-hover:ring-white/30" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em]">
          <span className={s?.text}>{STATUS_VERBS[item.status]}</span>
          <span className="text-slate-600">/</span>
          <time dateTime={item.createdAt} className="text-muted">
            {timeAgo(item.createdAt)}
          </time>
        </p>
        <h3 className="mt-1 truncate">
          <Link to={`/log?film=${item.film.tmdbId}`} className="t-film text-[16px] transition hover:text-neon">
            {item.film.title}
          </Link>
        </h3>
        {item.rating ? <RatingBar rating={item.rating} className="mt-1.5" /> : null}
        {item.note ? <p className="mt-1.5 line-clamp-2 text-[14.5px] leading-snug text-slate-400">{item.note}</p> : null}
      </div>
    </article>
  )
}

/** Home page "take": the note leads, the poster and player follow. */
export function TakeCard({ item, index = 0 }) {
  const logHref = `/log?film=${item.film.tmdbId}`
  return (
    <article data-reveal style={{ '--i': index }} className="group relative flex flex-col justify-between gap-8 border-t border-white/[0.1] pt-6">
      <div>
        <p className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          <StatusChip status={item.status} />
          <time dateTime={item.createdAt}>{timeAgo(item.createdAt)}</time>
        </p>
        <p className="mt-5 text-[19px] leading-snug text-white sm:text-[21px]">
          {item.note ? <>&ldquo;{item.note}&rdquo;</> : <span className="text-slate-400">No take, just the log.</span>}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Link to={logHref} className="shrink-0" aria-label={`Log ${item.film.title}`}>
          <Poster path={item.film.posterPath} title={item.film.title} size="w92" className="w-14 rounded-[3px] ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-neon/50" />
        </Link>
        <div className="min-w-0">
          <h3 className="truncate">
            <Link to={logHref} className="t-film text-[17px] transition hover:text-neon">
              {item.film.title}
            </Link>
          </h3>
          <Link to={`/u/${item.user.username}`} className="mt-1 flex items-center gap-2 text-sm text-muted transition hover:text-white">
            <Avatar user={item.user} size={18} />
            <span className="truncate">{item.user.displayName}</span>
            {item.rating ? <span className="font-mono text-[12px] font-semibold text-acid">{item.rating}/10</span> : null}
          </Link>
        </div>
      </div>
    </article>
  )
}

export function ActivitySkeleton({ count = 3 }) {
  return (
    <div aria-busy="true" aria-label="Loading feed" className="pt-6">
      <Skeleton className="mb-2 h-3 w-24" />
      {Array.from({ length: count }, (_, i) =>
        // Same alternating shapes as the real feed: a take, then a log line.
        i % 2 === 0 ? (
          <div key={i} className="grid grid-cols-[56px_1fr] gap-4 border-b border-white/[0.07] py-6 sm:grid-cols-[88px_1fr] sm:gap-6 sm:py-7" style={{ opacity: 1 - i * 0.15 }}>
            <Skeleton className="aspect-[2/3] w-full rounded-[4px]" />
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-[26px] w-[26px] rounded-full" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="ml-auto h-3 w-14" />
              </div>
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </div>
        ) : (
          <div key={i} className="grid grid-cols-[56px_1fr] items-start gap-4 border-b border-white/[0.07] py-5 sm:grid-cols-[88px_1fr] sm:gap-6" style={{ opacity: 1 - i * 0.15 }}>
            <Skeleton className="aspect-[2/3] w-11 rounded-[3px] sm:w-14" />
            <div className="space-y-2.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ),
      )}
    </div>
  )
}
