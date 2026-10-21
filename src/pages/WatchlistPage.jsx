import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, ListVideo, Plus, Trash2 } from 'lucide-react'
import { STATUS_LABELS, WATCH_STATUSES } from '../../shared/constants.ts'
import StatusPicker from '../components/StatusPicker'
import { EmptyState, ErrorState, Poster, RatingInput, Skeleton, STATUS_STYLES, StatusChip } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { timeAgo } from '../lib/format'

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
    <main className="frame pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <p className="hud-label">Your list</p>
          <h1 className="t-h1 mt-5">Watchlist</h1>
          <p className="mt-4 max-w-md text-muted">Change a status or rating right here. Each change posts to the feed.</p>
        </div>
        <div className="flex items-end gap-8">
          {entries.length ? (
            <div className="hidden text-right sm:block">
              <p className="meta">Logged</p>
              <p className="t-num mt-2 text-5xl text-white">{entries.length}</p>
            </div>
          ) : null}
          <div className="flex gap-2">
            <Link to={`/u/${user.username}`} className="btn-quiet btn-sm">
              Profile <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link to="/log" className="btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" /> Log a film
            </Link>
          </div>
        </div>
      </header>

      <div className="tabs mask-fade-x -mx-5 mb-10 mt-10 px-5 sm:mx-0 sm:px-0 sm:[mask-image:none]" role="tablist" aria-label="Filter by status">
        <button type="button" role="tab" className="tab" aria-selected={!status} onClick={() => setParams({}, { replace: true })}>
          All <span className="tab-count">{entries.length}</span>
        </button>
        {WATCH_STATUSES.map((s) => (
          <button key={s} type="button" role="tab" className="tab" aria-selected={status === s} onClick={() => setParams({ status: s }, { replace: true })}>
            <span className={`h-1.5 w-1.5 ${STATUS_STYLES[s].bg}`} aria-hidden="true" />
            {STATUS_LABELS[s]} <span className="tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {list.loading && !list.data ? (
        <div className="grid gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-busy="true" aria-label="Loading watchlist">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="grid grid-cols-[104px_1fr] gap-4 sm:block">
              <Skeleton className="aspect-[2/3] w-full rounded-[5px]" />
              <div className="space-y-3 sm:mt-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} title="Your watchlist didn't load" />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={ListVideo}
          label={status ? `Filter: ${STATUS_LABELS[status]}` : 'Inventory · 0 films'}
          title={status ? `Nothing ${STATUS_LABELS[status].toLowerCase()}` : 'Your list is empty'}
          action={
            <Link to="/log" className="btn-primary">
              <Plus className="h-4 w-4" /> {status ? 'Log a film' : 'Log your first film'}
            </Link>
          }
        >
          {status ? 'Films you mark with this status show up here.' : 'Search for a film, set a status, and it lands here and on the feed.'}
        </EmptyState>
      ) : (
        <ul className="grid gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((entry, i) => (
            <EntryCard key={entry.tmdbId} entry={entry} index={i} onChange={replace} onRemove={drop} onRestore={restore} />
          ))}
        </ul>
      )}
    </main>
  )
}

function EntryCard({ entry, index, onChange, onRemove, onRestore }) {
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
    <li className="group grid grid-cols-[104px_1fr] gap-4 sm:block" data-reveal style={{ '--i': index % 5 }}>
      <div className="relative self-start">
        <Link to={`/log?film=${entry.tmdbId}`} className="block" aria-label={`Edit ${entry.title} in the logger`}>
          <span className="relative block overflow-hidden rounded-[5px] ring-1 ring-white/10 transition duration-500 group-hover:ring-white/25">
            <Poster path={entry.posterPath} title={entry.title} className="w-full transition duration-700 ease-out group-hover:scale-[1.03]" />
            <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-[3px] ${STATUS_STYLES[entry.status].bg}`} />
          </span>
        </Link>
        <StatusChip status={entry.status} boxed className="absolute left-2 top-2 hidden sm:inline-flex" />
        {confirming ? (
          <div className="absolute inset-0 flex animate-fade flex-col items-center justify-center gap-3 rounded-[5px] bg-void/90 p-3 text-center backdrop-blur-sm">
            <p className="text-sm text-slate-200">Remove from your list?</p>
            <div className="flex flex-col gap-1.5 sm:flex-row">
              <button type="button" onClick={remove} className="btn-sm btn text-ember [--plate:rgba(255,107,91,0.14)] hover:[--plate:rgba(255,107,91,0.24)]">
                Remove
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="btn-sm btn-quiet">
                Keep
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-void/75 text-slate-300 backdrop-blur transition hover:bg-ember/20 hover:text-ember sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100"
            aria-label={`Remove ${entry.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="min-w-0 sm:mt-4">
        <h2 className="t-film truncate text-[17px] leading-tight">{entry.title}</h2>
        <p className="meta mt-1.5 truncate">
          {[entry.releaseYear, entry.genres?.[0]].filter(Boolean).join(' · ')} · {timeAgo(entry.updatedAt)}
        </p>
        <div className="mt-4">
          <span id={`status-${entry.tmdbId}`} className="sr-only">
            Status for {entry.title}
          </span>
          <StatusPicker size="sm" value={entry.status} disabled={busy} labelledBy={`status-${entry.tmdbId}`} onChange={(s) => s !== entry.status && patch({ status: s })} />
        </div>
        <div className="mt-3">
          <span id={`rating-${entry.tmdbId}`} className="sr-only">
            Rating for {entry.title}
          </span>
          <RatingInput compact value={entry.rating} onChange={(r) => patch({ rating: r })} id={`rating-${entry.tmdbId}`} />
        </div>
        {entry.note ? <p className="mt-3 line-clamp-2 text-[14px] leading-snug text-slate-400">&ldquo;{entry.note}&rdquo;</p> : null}
      </div>
    </li>
  )
}
