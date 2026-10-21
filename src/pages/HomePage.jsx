import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Heart, ListVideo, Plus, Radio } from 'lucide-react'
import { TakeCard } from '../components/ActivityCard'
import { DemoButton } from '../components/Navbar'
import { Avatar, EmptyState, ErrorState, Poster, RatingBar, SectionHead, Skeleton, StatusChip } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { pad2 } from '../lib/format'
import { getTrending, imageUrl } from '../lib/tmdb'
import { STATUS_VERBS, WATCH_STATUSES } from '../../shared/constants.ts'

const CYCLE_MS = 6500

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export default function HomePage() {
  const { user } = useAuth()
  const feed = useApi('/feed?limit=12')
  const [trending, setTrending] = useState({ films: [], source: null, loading: true })

  useEffect(() => {
    const c = new AbortController()
    getTrending(c.signal)
      .then((t) => setTrending({ ...t, loading: false }))
      .catch(() => {})
    return () => c.abort()
  }, [])

  const items = feed.data?.items ?? []
  const featured = trending.films.filter((f) => f.posterPath && f.backdropPath).slice(0, 5)

  return (
    <main>
      <Hero featured={featured} loading={trending.loading} user={user} />
      <Ticker items={items} loading={feed.loading && !feed.data} />

      {/* Trending rail */}
      <section className="pt-20 sm:pt-24" aria-labelledby="trending">
        <TrendingRail films={trending.films.slice(0, 10)} source={trending.source} loading={trending.loading} />
      </section>

      {/* How it plays */}
      <section className="frame pt-28 sm:pt-36" aria-labelledby="how">
        <SectionHead id="how" label="How it plays" title={<>Three moves.<br className="hidden sm:block" /> One list.</>} />
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] md:grid-cols-3">
          <Step n={1} title="Log it" body="Search any film, pick a status, rate it out of ten. Add a take if you have one.">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {WATCH_STATUSES.map((s) => (
                <StatusChip key={s} status={s} />
              ))}
            </div>
            <RatingBar rating={8} className="mt-4" />
          </Step>
          <Step n={2} title="Share it" body="Every log and status change lands on the squad feed and your public profile.">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[...new Map(items.map((i) => [i.user.username, i.user])).values()].slice(0, 5).map((u) => (
                  <Avatar key={u.username} user={u} size={30} className="ring-2 ring-panel" />
                ))}
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-plasma">
                <Heart className="h-3.5 w-3.5 fill-plasma" /> Likes, takes
              </span>
            </div>
          </Step>
          <Step n={3} title="Find the next one" body="For you ranks what to watch next from the genres you rate highest and what the squad loved.">
            <div className="flex gap-2">
              {trending.films.slice(10, 14).map((f) => (
                <Poster key={f.tmdbId} path={f.posterPath} title={f.title} size="w92" className="w-14 rounded-[3px] ring-1 ring-white/10" />
              ))}
            </div>
          </Step>
        </ol>
      </section>

      {/* Recent feed */}
      <section className="frame pt-28 sm:pt-36" aria-labelledby="recent-feed">
        <SectionHead
          id="recent-feed"
          label="Squad takes"
          title="Recent feed"
          aside={
            <Link to="/feed" className="link-arrow">
              Open the feed <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        {feed.loading && !feed.data ? (
          <div className="grid gap-10 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-4 border-t border-white/[0.1] pt-6">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ))}
          </div>
        ) : feed.error ? (
          <ErrorState error={feed.error} onRetry={feed.reload} title="The feed didn't load" />
        ) : items.length === 0 ? (
          <EmptyState label="Channel quiet" title="Quiet in here" action={<Link to="/log" className="btn-primary">Log the first film</Link>}>
            Nobody has logged a film yet. Be first.
          </EmptyState>
        ) : (
          <div className="grid gap-x-10 gap-y-14 md:grid-cols-3">
            {takes(items).map((item, i) => (
              <TakeCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </section>

      <FinalCall films={trending.films} user={user} />
    </main>
  )
}

/** Three posts for the home page: takes first, and never the same film twice. */
function takes(items) {
  const films = new Set()
  return [...items.filter((i) => i.note), ...items.filter((i) => !i.note)]
    .filter((i) => !films.has(i.film.tmdbId) && films.add(i.film.tmdbId))
    .slice(0, 3)
}

function Hero({ featured, loading, user }) {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [seen, setSeen] = useState(1)
  const [paused, setPaused] = useState(false)
  const count = featured.length
  const film = featured[index]

  useEffect(() => {
    if (reduced || paused || count < 2) return
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), CYCLE_MS)
    return () => clearTimeout(t)
  }, [index, reduced, paused, count])

  useEffect(() => {
    setSeen((s) => Math.max(s, Math.min(count, index + 2)))
  }, [index, count])

  return (
    <section className="relative isolate overflow-hidden border-b border-white/[0.06]" aria-label="Introduction">
      {/* Backdrop: the featured film, crossfading. Only loaded up to one ahead of what's been shown. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-void">
        {featured.slice(0, seen).map((f, i) => (
          <img
            key={f.tmdbId}
            src={imageUrl(f.backdropPath, 'w1280')}
            alt=""
            fetchpriority={i === 0 ? 'high' : undefined}
            className={`absolute inset-0 h-full w-full object-cover object-[70%_30%] transition-opacity duration-[1400ms] ease-out ${
              i === index ? 'ken-burns opacity-60' : 'opacity-0'
            }`}
          />
        ))}
        <div className="scanlines absolute inset-0 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/80 to-void/0 max-lg:bg-void/55" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void via-void/60 to-transparent" />
        <div className="grid-bg absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_20%_40%,black,transparent)]" />
      </div>

      <div className="frame grid min-h-[min(820px,calc(100svh-7.5rem))] items-end gap-12 pb-12 pt-16 sm:pb-16 lg:grid-cols-12 lg:gap-8 lg:pt-16">
        <div className="lg:col-span-7">
          <p className="hud-label animate-rise">
            Film log <span className="text-slate-600">/</span> Squad feed
          </p>
          <h1 className="t-hero mt-7 animate-rise [animation-delay:80ms]">
            Log films.
            <br />
            <span className="outline-num [-webkit-text-stroke-color:rgba(238,241,248,0.85)]">Rate them.</span>
            <br />
            <span className="text-neon">Show the squad.</span>
          </h1>
          <p className="t-lead mt-8 max-w-[34rem] animate-rise [animation-delay:160ms]">
            Mark every film watching, completed, queued or dropped. Rate it out of ten, add a take, and it lands on your profile and the live feed.
          </p>
          <div className="mt-10 flex flex-col gap-3 animate-rise [animation-delay:240ms] sm:flex-row sm:flex-wrap">
            {user ? (
              <>
                <Link to="/log" className="btn-primary">
                  <Plus className="h-4 w-4" /> Log a film
                </Link>
                <Link to="/watchlist" className="btn-ghost">
                  <ListVideo className="h-4 w-4" /> Your watchlist
                </Link>
              </>
            ) : (
              <>
                <DemoButton>Try it, no sign-up</DemoButton>
                <Link to="/feed" className="btn-ghost">
                  <Radio className="h-4 w-4" /> View live feed
                </Link>
              </>
            )}
          </div>
          {!user ? (
            <p className="mt-5 text-sm text-muted animate-rise [animation-delay:300ms]">
              The demo opens a 24-hour guest account.{' '}
              <Link to="/signup" className="text-ink underline decoration-neon/60 underline-offset-4 transition hover:text-neon">
                Create a real one
              </Link>{' '}
              to keep your log.
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-4 lg:col-start-9" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <Target film={film} index={index} count={count} loading={loading} onPick={setIndex} paused={paused || reduced} />
        </div>
      </div>
    </section>
  )
}

/** The "locked target": the featured film's poster in HUD brackets with a readout. */
function Target({ film, index, count, loading, onPick, paused }) {
  if (loading || !film) {
    return (
      <div className="flex gap-5 lg:block">
        <Skeleton className="aspect-[2/3] w-32 shrink-0 rounded-[6px] sm:w-40 lg:w-full lg:max-w-[300px]" />
        <div className="flex-1 space-y-3 pt-2 lg:mt-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
    )
  }
  return (
    <div className="animate-rise [animation-delay:200ms]">
      <p className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        <span>
          <span className="text-neon">Target</span> {pad2(index + 1)} / {pad2(count)}
        </span>
        <span className="hidden sm:inline">Trending</span>
      </p>
      <div className="flex gap-5 lg:block">
        <Link to={`/log?film=${film.tmdbId}`} className="group relative block w-32 shrink-0 sm:w-40 lg:w-full lg:max-w-[300px]" aria-label={`Log ${film.title}`}>
          <span className="hud-corners block" style={{ '--inset': '-8px', '--corner-len': '18px' }}>
            <span className="relative block overflow-hidden rounded-[6px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]">
              <Poster key={film.tmdbId} path={film.posterPath} title={film.title} size="w500" priority className="w-full transition duration-700 ease-out group-hover:scale-[1.03]" />
              <span aria-hidden="true" className="scanlines absolute inset-0 opacity-30" />
            </span>
          </span>
        </Link>
        <div className="min-w-0 flex-1 lg:mt-7">
          <p key={film.tmdbId} className="t-film animate-rise text-[20px] leading-tight lg:text-[24px]">
            {film.title}
          </p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
            {[film.releaseYear, film.genres?.[0], film.voteAverage ? `TMDB ${film.voteAverage.toFixed(1)}` : null].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-5 flex gap-1.5" role="group" aria-label="Featured films">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPick(i)}
                aria-label={`Show featured film ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                className="group/dot relative h-6 flex-1"
              >
                <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden bg-white/15 transition group-hover/dot:bg-white/30">
                  {i === index ? (
                    <span
                      key={`${index}-${paused}`}
                      className="block h-full origin-left bg-neon"
                      style={paused ? undefined : { animation: `route-bar-fill ${CYCLE_MS}ms linear both` }}
                    />
                  ) : i < index ? (
                    <span className="block h-full bg-white/50" />
                  ) : null}
                </span>
              </button>
            ))}
          </div>
          <Link to={`/log?film=${film.tmdbId}`} className="link-arrow mt-5">
            Log this film <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Live activity as a HUD ticker. Pauses on hover; static and scrollable with reduced motion. */
function Ticker({ items, loading }) {
  if (loading) return <div className="h-14 border-b border-white/[0.06]" aria-hidden="true" />
  if (!items.length) return null
  const line = (hidden) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 whitespace-nowrap px-6 font-mono text-[12px] uppercase tracking-[0.08em]">
          <Avatar user={item.user} size={20} />
          <Link to={`/u/${item.user.username}`} tabIndex={hidden ? -1 : undefined} className="text-slate-200 transition hover:text-neon">
            @{item.user.username}
          </Link>
          <StatusVerb status={item.status} />
          <span className="text-white">{item.film.title}</span>
          {item.rating ? <span className="font-display text-[11px] font-bold text-acid">{item.rating}/10</span> : null}
          <span className="pl-4 text-slate-700" aria-hidden="true">
            ///
          </span>
        </li>
      ))}
    </ul>
  )
  return (
    <section aria-label="Live squad activity" className="group relative flex h-14 items-center overflow-hidden border-b border-white/[0.06] bg-white/[0.015]">
      <span className="relative z-10 flex h-full shrink-0 items-center gap-2 border-r border-white/[0.08] bg-void px-5 font-mono text-[11px] uppercase tracking-[0.2em] text-plasma sm:px-8">
        <span className="h-1.5 w-1.5 animate-blip bg-plasma" /> Live
      </span>
      <div className="mask-fade-x flex min-w-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
          {line(false)}
          {line(true)}
        </div>
      </div>
    </section>
  )
}

function StatusVerb({ status }) {
  const colors = { watching: 'text-neon', completed: 'text-acid', planned: 'text-plasma', dropped: 'text-ember' }
  return <span className={colors[status]}>{STATUS_VERBS[status]}</span>
}

function TrendingRail({ films, source, loading }) {
  const rail = useRef(null)
  const scroll = (dir) => {
    const el = rail.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }
  return (
    <>
      <div className="frame">
        <SectionHead
          id="trending"
          label={source === 'catalog' ? 'Offline catalog' : 'This week on TMDB'}
          title="Trending now"
          aside={
            <div className="flex items-center gap-2">
              <button type="button" className="btn-icon hidden border border-white/10 md:inline-flex" onClick={() => scroll(-1)} aria-label="Scroll trending left">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button type="button" className="btn-icon hidden border border-white/10 md:inline-flex" onClick={() => scroll(1)} aria-label="Scroll trending right">
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link to="/log" className="link-arrow ml-3">
                Search all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          }
        >
          {source === 'catalog' ? 'No TMDB key on this server, so these come from the built-in catalogue of real films.' : 'Pick one to log it.'}
        </SectionHead>
      </div>
      <ol
        ref={rail}
        className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 pr-5 sm:gap-5 sm:pr-8"
        style={{ paddingLeft: 'max(0.25rem, calc((100vw - 1240px) / 2 + 0.5rem))', scrollPaddingLeft: 'max(0.25rem, calc((100vw - 1240px) / 2 + 0.5rem))' }}
        aria-label="Trending films"
      >
        {loading
          ? Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="shrink-0 pl-[3.75rem] sm:pl-[5.75rem]">
                <Skeleton className="aspect-[2/3] w-[148px] rounded-[5px] sm:w-[196px]" />
              </li>
            ))
          : films.map((film, i) => (
              <li key={film.tmdbId} className={`group shrink-0 snap-start ${i >= 9 ? 'pl-[6rem] sm:pl-[9.5rem]' : 'pl-[3.75rem] sm:pl-[5.75rem]'}`} data-reveal="scan" style={{ '--i': Math.min(i, 6) }}>
                <Link to={`/log?film=${film.tmdbId}`} className="relative block w-[148px] sm:w-[196px]">
                  <span className="relative block">
                    <span
                      aria-hidden="true"
                      className="outline-num absolute bottom-[-0.07em] right-[calc(100%+0.2rem)] font-display font-black leading-none tracking-[-0.07em] transition-[-webkit-text-stroke-color] duration-500 group-hover:[-webkit-text-stroke-color:#00f5ff]"
                      style={{ fontSize: 'clamp(4.75rem, 7.5vw, 7.25rem)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="lock-on hud-corners relative block">
                      <span className="block overflow-hidden rounded-[5px] ring-1 ring-white/10 transition duration-500 ease-out group-hover:-translate-y-1.5 group-hover:ring-white/25">
                        <Poster path={film.posterPath} title={film.title} eager={i < 5} className="w-full transition duration-700 ease-out group-hover:scale-[1.04]" />
                      </span>
                    </span>
                  </span>
                  <span className="mt-3.5 block truncate font-semibold text-white">{film.title}</span>
                  <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                    {[film.releaseYear, film.genres?.[0]].filter(Boolean).join(' · ')}
                  </span>
                </Link>
              </li>
            ))}
      </ol>
    </>
  )
}

function Step({ n, title, body, children }) {
  return (
    <li className="flex flex-col justify-between gap-10 bg-void p-7 sm:p-9" data-reveal style={{ '--i': n - 1 }}>
      <div>
        <span className="outline-num block font-display text-6xl font-black leading-none tracking-[-0.05em]">{pad2(n)}</span>
        <h3 className="mt-8 font-display text-xl font-bold uppercase tracking-tight text-white">{title}</h3>
        <p className="mt-3 max-w-xs text-muted">{body}</p>
      </div>
      <div className="min-h-[4.5rem]">{children}</div>
    </li>
  )
}

function FinalCall({ films, user }) {
  const wall = films.filter((f) => f.posterPath).slice(0, 12)
  return (
    <section className="frame pt-28 sm:pt-36" aria-labelledby="cta">
      <div className="relative isolate overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 sm:px-14 sm:py-20" data-reveal>
        <div aria-hidden="true" className="absolute -right-10 -top-24 bottom-[-6rem] -z-10 hidden w-[46%] rotate-6 grid-cols-3 gap-3 opacity-50 [mask-image:linear-gradient(to_left,black_30%,transparent)] md:grid">
          {[0, 1, 2].map((col) => (
            <div key={col} className="overflow-hidden">
              <div className={`flex flex-col gap-3 animate-marquee-y ${col === 1 ? '[animation-direction:reverse]' : ''}`} style={{ animationDuration: `${46 + col * 8}s` }}>
                {[...wall.slice(col * 4, col * 4 + 4), ...wall.slice(col * 4, col * 4 + 4)].map((f, i) => (
                  <Poster key={`${f.tmdbId}-${i}`} path={f.posterPath} title="" size="w185" className="w-full rounded-[4px]" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="hud-label">Player two, ready?</p>
        <h2 id="cta" className="t-h1 mt-6 max-w-[14ch]">
          Your list starts with one film.
        </h2>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          {user ? (
            <Link to="/log" className="btn-primary">
              <Plus className="h-4 w-4" /> Log a film
            </Link>
          ) : (
            <>
              <DemoButton>Start the demo</DemoButton>
              <Link to="/signup" className="btn-ghost">
                Create an account
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
