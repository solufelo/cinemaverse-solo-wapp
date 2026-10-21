import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ListChecks, Plus, Trash2 } from 'lucide-react'
import { STATUS_LABELS, WATCH_STATUSES } from '../../shared/constants.ts'
import StatusPicker from '../components/StatusPicker'
import { EmptyState, ErrorState, Poster, RatingInput, Skeleton } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { plural, timeAgo } from '../lib/format'

export default function WatchlistPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const status = WATCH_STATUSES.includes(params.get('status')) ? params.get('status') : null
  const list = useApi('/watchlist')
  const entries = list.data?.entries ?? []
  const shown = status ? entries.filter((e) => e.status === status) : entries
  const counts = WATCH_STATUSES.reduce((acc, s) => ({ ...acc, [s]: entries.filter((e) => e.status === s).length }), {})

  const replace = (entry) => list.setData((d) => ({ ...d, entries: d.entries.map((e) => (e.tmdbId === entry.tmdbId ? entry : e)) }))
  const drop = (tmdbId) => list.setData((d) => ({ ...d, entries: d.entries.filter((e) => e.tmdbId !== tmdbId) }))
  const restore = (entry) => list.setData((d) => ({ ...d, entries: [entry, ...d.entries.filter((e) => e.tmdbId !== entry.tmdbId)] }))

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Your list</p>
          <h1 className="page-title">Watchlist</h1>
          <p className="mt-2 text-muted">
            {list.data ? `${plural(entries.length, 'film')} logged.` : 'Everything you are watching, finished, queued or dropped.'} Changes
            to status or rating post to the feed.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/u/${user.username}`} className="btn-quiet btn-sm">
            Public profile
          </Link>
          <Link to="/log" className="btn-primary btn-sm">
            <Plus className="h-3.5 w-3.5" /> Log a film
          </Link>
        </div>
      </div>

      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Filter by status">
        <button type="button" role="tab" className="tab" aria-selected={!status} onClick={() => setParams({}, { replace: true })}>
          All <span className="tabular-nums opacity-70">{entries.length}</span>
        </button>
        {WATCH_STATUSES.map((s) => (
          <button key={s} type="button" role="tab" className="tab" aria-selected={status === s} onClick={() => setParams({ status: s }, { replace: true })}>
            {STATUS_LABELS[s]} <span className="tabular-nums opacity-70">{counts[s]}</span>
          </button>
        ))}
      </div>

      {list.loading && !list.data ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="panel flex gap-4 p-4">
              <Skeleton className="aspect-[2/3] w-24 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-7 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} title="Your watchlist didn't load" />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={status ? `Nothing ${STATUS_LABELS[status].toLowerCase()}` : 'Your list is empty'}
          action={
            <Link to="/log" className="btn-primary">
              <Plus className="h-4 w-4" /> Log your first film
            </Link>
          }
        >
          {status ? 'Films you mark with this status show up here.' : 'Search for a film, set a status, and it lands here and on the feed.'}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {shown.map((entry) => (
            <EntryCard key={entry.tmdbId} entry={entry} onChange={replace} onRemove={drop} onRestore={restore} />
          ))}
        </ul>
      )}
    </main>
  )
}

function EntryCard({ entry, onChange, onRemove, onRestore }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const patch = async (body) => {
    const prev = entry
    onChange({ ...entry, ...body })
    setBusy(true)
    try {
      const res = await api(`/watchlist/${entry.tmdbId}`, { method: 'PATCH', body })
      onChange(res.entry)
      if (res.activityId && body.status) toast.push({ message: `${entry.title}: ${STATUS_LABELS[body.status]}. Posted to the feed.` })
    } catch (err) {
      onChange(prev)
      toast.push({ tone: 'error', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    onRemove(entry.tmdbId)
    try {
      await api(`/watchlist/${entry.tmdbId}`, { method: 'DELETE' })
      toast.push({ message: `Removed ${entry.title} from your list.` })
    } catch (err) {
      onRestore(entry)
      toast.push({ tone: 'error', message: err.message })
    }
  }

  return (
    <li className="panel flex gap-4 p-4 transition hover:border-white/15">
      <Link to={`/log?film=${entry.tmdbId}`} className="shrink-0" aria-label={`Edit ${entry.title} in the logger`}>
        <Poster path={entry.posterPath} title={entry.title} size="w185" className="w-20 rounded-lg ring-1 ring-white/10 sm:w-24" />
      </Link>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-display text-[15px] font-bold tracking-wide text-white">{entry.title}</h2>
            <p className="text-sm text-muted">
              {[entry.releaseYear, entry.genres?.[0]].filter(Boolean).join(' · ')} · updated {timeAgo(entry.updatedAt)}
            </p>
          </div>
          {confirming ? (
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <button type="button" onClick={remove} className="rounded px-2 py-1 font-semibold text-ember hover:bg-ember/10">
                Remove
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="rounded px-2 py-1 text-muted hover:text-white">
                Keep
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="shrink-0 rounded p-1.5 text-muted hover:text-ember" aria-label={`Remove ${entry.title}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <StatusPicker size="sm" value={entry.status} disabled={busy} onChange={(s) => s !== entry.status && patch({ status: s })} />
        <RatingInput value={entry.rating} onChange={(r) => patch({ rating: r })} id={`rating-${entry.tmdbId}`} />
        {entry.note ? <p className="line-clamp-2 border-l-2 border-white/10 pl-3 text-sm text-slate-300">{entry.note}</p> : null}
      </div>
    </li>
  )
}
