import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Check, Info, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { EmptyState, ErrorState, Poster, Skeleton } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { plural } from '../lib/format'

export default function ForYouPage() {
  const recs = useApi('/recommendations')
  const data = recs.data

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Recommendations
          </p>
          <h1 className="page-title">For you</h1>
          <p className="mt-2 text-muted">
            {data ? `Based on ${plural(data.basedOn, 'film')} in your log.` : 'Reading your log…'}
          </p>
        </div>
        <button type="button" onClick={recs.reload} disabled={recs.loading} className="btn-quiet btn-sm">
          <RefreshCw className={`h-3.5 w-3.5 ${recs.loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {data ? <SourceBanner data={data} /> : null}

      {recs.loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="panel flex gap-4 p-4">
              <Skeleton className="aspect-[2/3] w-24 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-3 pt-1">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : recs.error ? (
        <ErrorState error={recs.error} onRetry={recs.reload} title="Couldn't build recommendations" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Sparkles} title="You've seen it all" action={<Link to="/log" className="btn-primary">Search for more</Link>}>
          Every film we know about is already on your list.
        </EmptyState>
      ) : (
        <ul className={`grid gap-4 md:grid-cols-2 ${recs.loading ? 'opacity-60' : ''}`}>
          {data.items.map((pick, i) => (
            <PickCard key={`${pick.tmdbId ?? pick.title}-${i}`} pick={pick} />
          ))}
        </ul>
      )}
    </main>
  )
}

function SourceBanner({ data }) {
  const ai = data.source === 'openrouter'
  return (
    <div className={`panel mb-6 flex items-start gap-3 p-4 ${ai ? 'border-plasma/30' : 'border-neon/20'}`}>
      {ai ? <Bot className="mt-0.5 h-5 w-5 shrink-0 text-plasma" /> : <Info className="mt-0.5 h-5 w-5 shrink-0 text-neon" />}
      <div className="text-[15px]">
        <p className="font-display text-[12px] font-bold uppercase tracking-wider text-white">
          {ai ? `AI picks · OpenRouter · ${data.model}` : 'Taste-match picks'}
        </p>
        <p className="mt-1 text-muted">
          {data.notice
            ? data.notice
            : ai
              ? 'Generated from your log. Titles are matched to TMDB where possible.'
              : data.aiConfigured
                ? 'Log a film first and AI picks will take over.'
                : 'Ranked by the genres you rate highly, what other players loved, and TMDB scores. No AI key is configured on this server, so nothing leaves it.'}
          {data.basedOn === 0 ? ' You have no logged films yet, so these are community favourites.' : ''}
        </p>
      </div>
    </div>
  )
}

function PickCard({ pick }) {
  const toast = useToast()
  const [state, setState] = useState('idle')

  const queue = async () => {
    setState('busy')
    try {
      await api(`/watchlist/${pick.tmdbId}`, {
        method: 'PUT',
        body: {
          film: { title: pick.title, posterPath: pick.posterPath, releaseYear: pick.releaseYear, genres: pick.genres },
          status: 'planned',
        },
      })
      setState('done')
      toast.push({ message: `Queued ${pick.title}.`, link: { to: '/watchlist?status=planned', label: 'Open queue' } })
    } catch (err) {
      setState('idle')
      toast.push({ tone: 'error', message: err.message })
    }
  }

  return (
    <li className="panel group flex gap-4 p-4 transition hover:border-white/15">
      <Poster path={pick.posterPath} title={pick.title} size="w185" className="w-24 shrink-0 rounded-lg ring-1 ring-white/10" />
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="font-display text-base font-bold leading-tight text-white">{pick.title}</h2>
        <p className="mt-1 text-sm text-muted">{[pick.releaseYear, ...pick.genres.slice(0, 3)].filter(Boolean).join(' · ')}</p>
        <p className="mt-3 flex-1 text-[15px] leading-relaxed text-slate-200">
          <Sparkles className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px text-plasma" aria-hidden="true" />
          {pick.reason}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {pick.tmdbId ? (
            <>
              <button type="button" onClick={queue} disabled={state !== 'idle'} className={state === 'done' ? 'btn-quiet btn-sm text-acid' : 'btn-ghost btn-sm'}>
                {state === 'done' ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {state === 'done' ? 'Queued' : state === 'busy' ? 'Queuing…' : 'Queue it'}
              </button>
              <Link to={`/log?film=${pick.tmdbId}`} className="btn-quiet btn-sm">
                Log it
              </Link>
            </>
          ) : (
            <Link to={`/log?q=${encodeURIComponent(pick.title)}`} className="btn-ghost btn-sm">
              Find on TMDB
            </Link>
          )}
        </div>
      </div>
    </li>
  )
}
