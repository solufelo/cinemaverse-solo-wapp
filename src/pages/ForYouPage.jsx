import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Check, Cpu, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { EmptyState, ErrorState, Poster, Skeleton } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { pad2, plural } from '../lib/format'
import { imageUrl } from '../lib/tmdb'

export default function ForYouPage() {
  const recs = useApi('/recommendations')
  const data = recs.data
  const [top, ...rest] = data?.items ?? []

  return (
    <main className="frame pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="hud-label" style={{ '--mark': '#ff2d95' }}>
            Recommendations
          </p>
          <h1 className="t-h1 mt-5">For you</h1>
          <p className="mt-4 text-muted">{data ? `Ranked from ${plural(data.basedOn, 'film')} in your log.` : 'Reading your log…'}</p>
        </div>
        <button type="button" onClick={recs.reload} disabled={recs.loading} className="btn-quiet btn-sm">
          <RefreshCw className={`h-3.5 w-3.5 ${recs.loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {data ? <SourceLine data={data} /> : <div className="mt-10 h-px bg-white/[0.07]" />}

      <div className="mt-10">
        {recs.loading && !data ? (
          <div aria-busy="true" aria-label="Loading recommendations">
            <Skeleton className="h-[340px] w-full rounded-2xl" />
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[2/3] w-full rounded-[5px]" />
                  <Skeleton className="mt-3 h-4 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : recs.error ? (
          <ErrorState error={recs.error} onRetry={recs.reload} title="Couldn't build recommendations" />
        ) : !top ? (
          <EmptyState icon={Sparkles} label="Nothing left" title="You've seen it all" action={<Link to="/log" className="btn-primary">Search for more</Link>}>
            Every film we know about is already on your list.
          </EmptyState>
        ) : (
          <div className={`transition-opacity duration-300 ${recs.loading ? 'opacity-50' : ''}`}>
            <TopPick pick={top} />
            {rest.length ? (
              <>
                <p className="hud-label mb-8 mt-20">Also in range</p>
                <ul className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
                  {rest.map((pick, i) => (
                    <PickCard key={`${pick.tmdbId ?? pick.title}-${i}`} pick={pick} rank={i + 2} />
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        )}
      </div>
    </main>
  )
}

function SourceLine({ data }) {
  const ai = data.source === 'openrouter'
  const Icon = ai ? Bot : Cpu
  return (
    <div className="mt-10 flex flex-col gap-3 border-y border-white/[0.07] py-5 sm:flex-row sm:items-start sm:gap-6">
      <p className="flex shrink-0 items-center gap-2.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-white">
        <Icon className={`h-4 w-4 ${ai ? 'text-plasma' : 'text-neon'}`} />
        {ai ? `AI picks · ${data.model}` : 'Taste-match picks'}
      </p>
      <p className="text-[15px] leading-relaxed text-muted">
        {data.notice
          ? data.notice
          : ai
            ? 'Generated from your log through OpenRouter. Titles are matched to TMDB where possible.'
            : data.aiConfigured
              ? 'Log a film first and AI picks will take over.'
              : 'Ranked by the genres you rate highly, what other players loved, and TMDB scores. No AI key is configured on this server, so nothing leaves it.'}
        {data.basedOn === 0 ? ' You have no logged films yet, so these are community favourites.' : ''}
      </p>
    </div>
  )
}

function useQueue(pick) {
  const toast = useToast()
  const [state, setState] = useState('idle')
  const queue = async () => {
    setState('busy')
    try {
      await api(`/watchlist/${pick.tmdbId}`, {
        method: 'PUT',
        body: {
          film: { title: pick.title, posterPath: pick.posterPath, backdropPath: pick.backdropPath ?? null, releaseYear: pick.releaseYear, genres: pick.genres },
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
  return [state, queue]
}

function Actions({ pick, size = '' }) {
  const [state, queue] = useQueue(pick)
  if (!pick.tmdbId) {
    return (
      <Link to={`/log?q=${encodeURIComponent(pick.title)}`} className={`btn-ghost ${size}`}>
        Find on TMDB
      </Link>
    )
  }
  return (
    <>
      <button type="button" onClick={queue} disabled={state !== 'idle'} className={`${state === 'done' ? 'btn-ghost text-acid disabled:opacity-100' : 'btn-primary'} ${size}`}>
        {state === 'done' ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        {state === 'done' ? 'Queued' : state === 'busy' ? 'Queuing…' : 'Queue it'}
      </button>
      <Link to={`/log?film=${pick.tmdbId}`} className={`btn-quiet ${size}`}>
        Log it
      </Link>
    </>
  )
}

/** The number-one pick gets the cinema treatment: backdrop, big poster, the reason up front. */
function TopPick({ pick }) {
  const backdrop = imageUrl(pick.backdropPath, 'w1280')
  return (
    <article className="relative isolate overflow-hidden rounded-2xl border border-white/[0.08]" data-reveal>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-panel">
        {backdrop ? <img src={backdrop} alt="" className="ken-burns h-full w-full object-cover object-[50%_30%] opacity-45" /> : <div className="grid-bg h-full w-full" />}
        <div className="scanlines absolute inset-0 opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/85 to-void/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-void/80 to-transparent" />
      </div>
      <div className="grid gap-8 p-6 sm:grid-cols-[180px_1fr] sm:gap-10 sm:p-10 lg:grid-cols-[220px_1fr] lg:p-12">
        <span className="hud-corners block w-36 sm:w-full" style={{ '--inset': '-7px', '--corner-len': '16px' }}>
          <Poster path={pick.posterPath} title={pick.title} size="w500" priority className="w-full rounded-[6px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]" />
        </span>
        <div className="flex flex-col justify-end">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            <span className="text-neon">Pick 01</span> · top match
          </p>
          <h2 className="t-h1 mt-4 max-w-[16ch] text-[clamp(2rem,1.2rem+2.6vw,3.6rem)]">{pick.title}</h2>
          <p className="meta mt-4">{[pick.releaseYear, ...pick.genres.slice(0, 3)].filter(Boolean).join(' · ')}</p>
          <p className="mt-6 max-w-[52ch] text-[18px] leading-relaxed text-slate-200">
            <Sparkles className="mr-2 inline h-4 w-4 -translate-y-0.5 text-plasma" aria-hidden="true" />
            {pick.reason}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Actions pick={pick} />
          </div>
        </div>
      </div>
    </article>
  )
}

function PickCard({ pick, rank }) {
  return (
    <li className="group flex flex-col" data-reveal style={{ '--i': (rank - 2) % 4 }}>
      <div className="relative">
        <span className="lock-on hud-corners block">
          <span className="block overflow-hidden rounded-[5px] ring-1 ring-white/10 transition duration-500 group-hover:-translate-y-1 group-hover:ring-white/25">
            <Poster path={pick.posterPath} title={pick.title} className="w-full transition duration-700 ease-out group-hover:scale-[1.04]" />
          </span>
        </span>
        <span className="absolute left-2 top-2 rounded-[3px] bg-void/85 px-2 py-1 font-display text-[11px] font-bold tabular-nums text-white backdrop-blur">{pad2(rank)}</span>
      </div>
      <h2 className="t-film mt-4 text-[17px] leading-tight">{pick.title}</h2>
      <p className="meta mt-1.5 truncate">{[pick.releaseYear, ...pick.genres.slice(0, 2)].filter(Boolean).join(' · ')}</p>
      <p className="mt-3 line-clamp-3 flex-1 text-[14.5px] leading-snug text-slate-400">{pick.reason}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Actions pick={pick} size="btn-sm" />
      </div>
    </li>
  )
}
