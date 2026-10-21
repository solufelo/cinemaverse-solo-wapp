import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Check, Cpu, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { EmptyState, ErrorState, Poster, Skeleton } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { metaLine, pad2, plural } from '../lib/format'
import { backdropFocus, imageUrl } from '../lib/tmdb'

export default function ForYouPage() {
  const recs = useApi('/recommendations')
  const data = recs.data
  const [top, ...rest] = data?.items ?? []
  // Two runners-up get wide cards; the rest sit in a poster grid. Seven picks fill both rows exactly.
  const runners = rest.slice(0, 2)
  const range = rest.slice(2)

  return (
    <main className="frame pt-10 sm:pt-14">
      <header>
        <p className="hud-label" style={{ '--mark': '#ff2d95' }}>
          Recommendations
        </p>
        <h1 className="t-h1 mt-5">For you</h1>
        <p className="mt-4 text-muted">{data ? `Ranked from ${plural(data.basedOn, 'film')} in your log.` : 'Reading your log…'}</p>
      </header>

      <div className="mt-10 flex items-start gap-4 border-y border-white/[0.07] py-5">
        {data ? <SourceLine data={data} /> : <p className="flex-1 font-mono text-[11.5px] uppercase tracking-[0.14em] text-muted">Matching…</p>}
        <button type="button" onClick={recs.reload} disabled={recs.loading} className="btn-icon -my-1.5 shrink-0" aria-label="Refresh picks" title="Refresh picks">
          <RefreshCw className={`h-4 w-4 ${recs.loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mt-10">
        {recs.loading && !data ? (
          <div aria-busy="true" aria-label="Loading recommendations">
            <Skeleton className="h-[340px] w-full" />
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[2/3] w-full" />
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
            {runners.length ? (
              <ul className="mt-6 grid gap-6 md:grid-cols-2">
                {runners.map((pick, i) => (
                  <RunnerUp key={`${pick.tmdbId ?? pick.title}-${i}`} pick={pick} rank={i + 2} />
                ))}
              </ul>
            ) : null}
            {range.length ? (
              <>
                <p className="hud-label mb-8 mt-20">Also in range</p>
                <ul className="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
                  {range.map((pick, i) => (
                    <PickCard key={`${pick.tmdbId ?? pick.title}-${i}`} pick={pick} rank={i + 4} />
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
    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
      <p className="flex shrink-0 items-center gap-2.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-white" title={ai ? data.model : undefined}>
        <Icon className={`h-4 w-4 ${ai ? 'text-plasma' : 'text-neon'}`} />
        {ai ? 'AI picks' : 'Taste-match picks'}
      </p>
      <p className="text-[15px] leading-relaxed text-muted">
        {data.notice
          ? data.notice
          : ai
            ? 'Written from your log, then matched to real films.'
            : data.basedOn === 0
              ? 'Picks from what the squad loved. Log a few films and they turn into picks from your own ratings.'
              : 'Picks from your ratings and the squad, ranked by the genres you score highest and what other players loved.'}
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

function Actions({ pick, size = '', quiet = false }) {
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
      <button
        type="button"
        onClick={queue}
        disabled={state !== 'idle'}
        className={`${state === 'done' ? 'btn-ghost text-acid disabled:opacity-100' : quiet ? 'btn-quiet hover:text-neon' : 'btn-primary'} ${size}`}
      >
        {state === 'done' ? <Check className="h-3.5 w-3.5" /> : <Plus className={`h-3.5 w-3.5 ${quiet ? 'text-neon' : ''}`} />}
        {state === 'done' ? 'Queued' : state === 'busy' ? 'Queuing…' : 'Queue it'}
      </button>
      <Link to={`/log?film=${pick.tmdbId}`} className={quiet ? `link-arrow px-2 ${size}` : `btn-quiet ${size}`}>
        Log it
      </Link>
    </>
  )
}

/** The number-one pick gets the cinema treatment: backdrop, big poster, the reason up front. */
function TopPick({ pick }) {
  const backdrop = imageUrl(pick.backdropPath, 'w1280')
  return (
    <article className="relative isolate overflow-hidden rounded-[4px] border border-white/[0.08]" data-reveal>
      {/* The still sits on the right and fades out before the copy; on phones it is a top band above the title. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-panel">
        {backdrop ? (
          <img
            src={backdrop}
            srcSet={`${imageUrl(pick.backdropPath, 'w780')} 780w, ${backdrop} 1280w`}
            sizes="(min-width: 640px) 60vw, 100vw"
            alt=""
            style={{ objectPosition: backdropFocus(pick.tmdbId) }}
            className="absolute right-0 top-0 h-[46%] w-full object-cover opacity-70 [mask-image:linear-gradient(to_bottom,black_40%,transparent)] sm:h-full sm:w-[62%] sm:[mask-image:linear-gradient(to_right,transparent,black_45%)]"
          />
        ) : (
          <div className="grid-bg h-full w-full" />
        )}
        <div className="scanlines absolute inset-0 opacity-30" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void/80 to-transparent" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-panel from-30% via-panel/70 via-55% to-transparent sm:block" />
      </div>
      <div className="grid gap-8 p-6 sm:grid-cols-[180px_1fr] sm:gap-10 sm:p-10 lg:grid-cols-[220px_1fr] lg:p-12">
        <span className="hud-corners block w-36 sm:w-full" style={{ '--inset': '-7px', '--corner-len': '16px' }}>
          <Poster path={pick.posterPath} title={pick.title} size="w500" priority className="w-full rounded-[4px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]" />
        </span>
        <div className="flex flex-col justify-end">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            <span className="text-neon">Pick 01</span> · top match
          </p>
          {/* Film titles are content, so they set in the reading face: real case, plain numerals. */}
          <h2 className="t-film mt-4 max-w-[18ch] text-[clamp(2rem,1.3rem+2.4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.015em]">{pick.title}</h2>
          <p className="meta mt-4">{metaLine(pick.releaseYear, pick.genres, { limit: 3, max: 32 })}</p>
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
    <li className="group flex flex-col" data-reveal="scan" style={{ '--i': (rank - 4) % 5 }}>
      <div className="relative">
        <span className="lock-on hud-corners block">
          <span className="block overflow-hidden rounded-[4px] ring-1 ring-white/10 transition duration-500 group-hover:-translate-y-1 group-hover:ring-white/25">
            <Poster path={pick.posterPath} title={pick.title} className="w-full transition duration-700 ease-out group-hover:scale-[1.04]" />
          </span>
        </span>
        <span className="absolute left-2 top-2 rounded-[3px] bg-void/85 px-2 py-1 font-mono text-[11px] font-semibold tabular-nums text-white backdrop-blur">{pad2(rank)}</span>
      </div>
      <h2 className="t-film mt-4 text-[17px] leading-tight">{pick.title}</h2>
      <p className="meta mt-1.5">{metaLine(pick.releaseYear, pick.genres, { limit: 1 })}</p>
      <p className="mt-3 flex-1 text-[14.5px] leading-snug text-slate-400">{pick.reason}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Actions pick={pick} size="btn-sm" quiet />
      </div>
    </li>
  )
}

/** Picks 02 and 03: poster beside the reason, a step down from the top pick. */
function RunnerUp({ pick, rank }) {
  return (
    <li className="group grid grid-cols-[96px_1fr] gap-5 rounded-[4px] border border-white/[0.07] bg-white/[0.02] p-5 sm:grid-cols-[132px_1fr] sm:gap-7 sm:p-6" data-reveal style={{ '--i': rank - 2 }}>
      <span className="lock-on hud-corners block self-start">
        <span className="block overflow-hidden rounded-[4px] ring-1 ring-white/10">
          <Poster path={pick.posterPath} title={pick.title} size="w342" className="w-full transition duration-700 ease-out group-hover:scale-[1.04]" />
        </span>
      </span>
      <div className="flex min-w-0 flex-col">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <span className="text-neon">Pick {pad2(rank)}</span>
        </p>
        <h2 className="t-film mt-2 text-[20px] leading-tight sm:text-[24px]">{pick.title}</h2>
        <p className="meta mt-2">{metaLine(pick.releaseYear, pick.genres, { max: 24 })}</p>
        <p className="mt-4 flex-1 text-[15px] leading-snug text-slate-300">{pick.reason}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Actions pick={pick} size="btn-sm" quiet />
        </div>
      </div>
    </li>
  )
}
