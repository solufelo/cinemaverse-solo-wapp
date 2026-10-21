import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { STATUS_VERBS } from '../../shared/constants.ts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/api'
import { timeAgo } from '../lib/format'
import { KindTag, PlayerLink, Poster, RatingBar, STATUS_STYLES, Skeleton, StatusChip } from './ui'

export default function ActivityCard({ item, onRemoved, compact = false }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [like, setLike] = useState({ likes: item.likes, likedByMe: item.likedByMe })
  const [busy, setBusy] = useState(false)
  const accent = STATUS_STYLES[item.status]?.bar
  const canDelete = user && (user.username === item.user.username || user.role === 'admin')

  async function toggleLike() {
    if (!user) {
      navigate('/login', { state: { from: '/feed' } })
      return
    }
    const prev = like
    const next = { likes: prev.likes + (prev.likedByMe ? -1 : 1), likedByMe: !prev.likedByMe }
    setLike(next)
    try {
      setLike(await api(`/feed/${item.id}/like`, { method: prev.likedByMe ? 'DELETE' : 'POST' }))
    } catch (err) {
      setLike(prev)
      toast.push({ tone: 'error', message: err.message })
    }
  }

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

  const logHref = `/log?film=${item.film.tmdbId}`

  return (
    <article
      className="panel group relative flex gap-4 overflow-hidden p-4 transition hover:border-white/15 sm:p-5"
      style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
    >
      <Link to={logHref} className="shrink-0" aria-label={`Log ${item.film.title}`}>
        <Poster
          path={item.film.posterPath}
          title={item.film.title}
          size="w185"
          className={`${compact ? 'w-14' : 'w-16 sm:w-20'} rounded-lg ring-1 ring-white/10 transition group-hover:ring-white/25`}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {compact ? null : (
            <>
              <PlayerLink user={item.user} />
              <KindTag kind={item.user.kind} />
            </>
          )}
          <time dateTime={item.createdAt} className="ml-auto shrink-0 text-sm text-muted" title={new Date(item.createdAt).toLocaleString()}>
            {timeAgo(item.createdAt)}
          </time>
        </div>

        <p className="mt-2 text-[15px] leading-snug text-slate-300">
          <span className="sr-only">{item.user.displayName} {STATUS_VERBS[item.status]} </span>
          <span className="font-display text-[15px] font-bold tracking-wide text-white sm:text-base">{item.film.title}</span>
          {item.film.releaseYear ? <span className="ml-2 text-muted">{item.film.releaseYear}</span> : null}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusChip status={item.status} />
          <RatingBar rating={item.rating} />
        </div>

        {item.note ? (
          <p className="mt-3 border-l-2 border-white/10 pl-3 text-[15px] leading-relaxed text-slate-200">{item.note}</p>
        ) : null}

        {!compact && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            <button
              type="button"
              onClick={toggleLike}
              aria-pressed={like.likedByMe}
              aria-label={like.likedByMe ? 'Unlike' : 'Like'}
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition ${like.likedByMe ? 'text-plasma' : 'text-muted hover:text-plasma'}`}
            >
              <Heart className={`h-4 w-4 ${like.likedByMe ? 'fill-plasma' : ''}`} />
              <span className="tabular-nums">{like.likes || ''}</span>
            </button>
            <Link to={logHref} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted transition hover:text-neon">
              <Plus className="h-4 w-4" /> Log this film
            </Link>
            {canDelete ? (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted transition hover:text-ember"
                aria-label="Delete post"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </article>
  )
}

export function ActivitySkeleton({ count = 3 }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading feed">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="panel flex gap-4 p-5">
          <Skeleton className="aspect-[2/3] w-16 shrink-0 rounded-lg sm:w-20" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}
