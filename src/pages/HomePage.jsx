import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Heart, ListVideo, Plus, Radio } from 'lucide-react'
import { TakeCard } from '../components/ActivityCard'
import { DemoButton } from '../components/Navbar'
import { Avatar, EmptyState, ErrorState, Poster, SectionHead, Skeleton, STATUS_STYLES, StatusChip } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { metaLine, pad2, pickTakes, timeAgo } from '../lib/format'
import { getTrending, imageUrl } from '../lib/tmdb'
import { CATALOG_BY_ID } from '../../shared/catalog.ts'
import { STATUS_VERBS } from '../../shared/constants.ts'

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
  const shelf = trending.source === 'catalog'

  return (
    <main>
      <Hero featured={featured} loading={trending.loading} user={user} shelf={shelf} />
      <Ticker items={items} loading={feed.loading && !feed.data} />

      {/* Trending rail (or, without live film data, the curated shelf) */}
      <section className="pt-20 sm:pt-24" aria-labelledby="trending" data-source={trending.source ?? undefined}>
        <TrendingRail films={trending.films.slice(0, 10)} total={trending.films.length} shelf={shelf} loading={trending.loading} />
      </section>

      {/* How it plays */}
      <section className="frame pt-28 sm:pt-36" aria-labelledby="how">
        <SectionHead id="how" label="How it plays" title={<>Three moves.<br className="hidden sm:block" /> One list.</>} />
        <ol className="grid gap-px overflow-hidden rounded-[4px] border border-white/[0.07] bg-white/[0.07] md:grid-cols-3">
          <Step n={1} title="Log it" body="Search any film, pick a status, rate it out of ten. Add a take if you have one.">
            <MiniLog />
          </Step>
          <Step n={2} title="Share it" body="Every log and status change lands on the squad feed and your public profile.">
            <MiniFeed item={items.find((i) => i.note && i.rating) ?? items[0]} />
          </Step>
          <Step n={3} title="Find the next one" body="For you ranks what to watch next from the genres you rate highest and what the squad loved.">
            <MiniPick />
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
          <ErrorState error={feed.error} onRetry={feed.reload} title="The feed is down for a moment" />
        ) : items.length === 0 ? (
          <EmptyState label="Channel quiet" title="Quiet in here" action={<Link to="/log" className="btn-primary">Log the first film</Link>}>
            Nobody has logged a film yet. Be first.
          </EmptyState>
        ) : (
          <div className="grid gap-x-10 gap-y-14 md:grid-cols-3">
            {pickTakes(items).map((item, i) => (
              <TakeCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </section>

      <FinalCall films={trending.films} user={user} />
    </main>
  )
}

function Hero({ featured, loading, user, shelf }) {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [seen, setSeen] = useState(1)
  const [paused, setPaused] = useState(false)
  const count = featured.length

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
      {/* Ambient wash: the featured still blurred down to colour, so no face or fragment ever sits under the copy. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-void">
        {featured.slice(0, seen).map((f, i) => (
          <img
            key={f.tmdbId}
            src={imageUrl(f.backdropPath, 'w300')}
            alt=""
            className={`absolute inset-0 h-full w-full scale-110 object-cover blur-[72px] saturate-150 transition-opacity duration-[1400ms] ease-out ${i === index ? 'opacity-40' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-void/75 to-void lg:bg-gradient-to-r lg:from-void lg:via-void/85 lg:to-void/30" />
        <div className="grid-bg absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_20%_40%,black,transparent)]" />
      </div>

      <div className="frame grid min-h-[min(820px,calc(100svh-7.5rem))] content-center gap-7 pb-12 pt-5 sm:pb-16 sm:pt-10 lg:grid-cols-12 lg:items-center lg:gap-8 lg:pt-16">
        <div className="lg:order-2 lg:col-span-5 lg:col-start-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <Target featured={featured} seen={seen} index={index} loading={loading} onPick={setIndex} paused={paused || reduced} shelf={shelf} />
        </div>

        <div className="lg:order-1 lg:col-span-7 lg:row-start-1">
          <p className="hud-label animate-rise">
            Film log <span className="text-slate-600">/</span> Squad feed
          </p>
          <h1 className="t-hero mt-5 animate-rise [animation-delay:80ms] sm:mt-7">
            Log films.
            <br />
            <span className="t-outline [-webkit-text-stroke-color:rgba(238,241,248,0.85)]">Rate them.</span>
            <br />
            <span className="text-neon">Show the squad.</span>
          </h1>
          <p className="t-lead mt-5 max-w-[34rem] animate-rise [animation-delay:160ms] sm:mt-8">
            Mark every film watching, completed, queued or dropped. Rate it out of ten, add a take, and it lands on your profile and the live feed.
          </p>
          <div className="mt-7 flex flex-col gap-3 animate-rise [animation-delay:240ms] sm:mt-10 sm:flex-row sm:flex-wrap">
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
                <DemoButton />
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
      </div>
    </section>
  )
}

/** Progress dashes for the featured films; each one is a 24px-tall target. */
function Dots({ count, index, onPick, paused }) {
  return (
    <div className="flex gap-1.5" role="group" aria-label="Featured films">
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
              <span key={`${index}-${paused}`} className="block h-full origin-left bg-neon" style={paused ? undefined : { animation: `route-bar-fill ${CYCLE_MS}ms linear both` }} />
            ) : i < index ? (
              <span className="block h-full bg-white/50" />
            ) : null}
          </span>
        </button>
      ))}
    </div>
  )
}

/**
 * The "locked target": the featured film as a still with its one-sheet laid over the corner.
 * The still is shown whole (16:9 in a 16:9 frame), so nothing is cropped by accident.
 * On phones it folds into one compact row above the headline, inside the first screen.
 */
function Target({ featured, seen, index, loading, onPick, paused, shelf }) {
  const film = featured[index]
  const count = featured.length
  const kicker = shelf ? 'Top rated' : 'Trending'
  if (loading || !film) {
    return (
      <div aria-busy="true" aria-label="Loading featured film">
        <div className="flex items-center gap-4 rounded-[4px] border border-white/[0.09] p-2.5 lg:hidden">
          <Skeleton className="aspect-[2/3] w-14 shrink-0 rounded-[3px]" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="hidden lg:block">
          <Skeleton className="mb-4 h-3 w-32" />
          <Skeleton className="aspect-video w-full" />
          <div className="relative mt-5 flex items-start gap-6 pl-5">
            <Skeleton className="-mt-[26%] aspect-[2/3] w-[36%] shrink-0 ring-1 ring-void" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    )
  }
  const href = `/log?film=${film.tmdbId}`
  const readout = (
    <>
      <span className="text-neon">Target</span> {pad2(index + 1)} / {pad2(count)}
    </>
  )
  return (
    <div className="animate-rise [animation-delay:120ms]">
      {/* Phone: one row inside the first screen. */}
      <div className="lg:hidden">
        <Link to={href} className="group flex items-center gap-4 rounded-[4px] border border-white/[0.09] bg-void/60 p-2.5 pr-4 backdrop-blur" aria-label={`Log ${film.title}`}>
          <Poster key={film.tmdbId} path={film.posterPath} title={film.title} size="w185" priority className="w-14 shrink-0 rounded-[3px] ring-1 ring-white/10" />
          <span className="min-w-0 flex-1">
            <span className="meta block text-[10.5px]">
              {readout} · {kicker}
            </span>
            <span className="t-film mt-1 line-clamp-2 block text-[16px] leading-tight">{film.title}</span>
            <span className="meta mt-1 block text-[10.5px]">{metaLine(film.releaseYear, film.genres, { limit: 1 })}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-neon" />
        </Link>
        <div className="mt-1.5 px-1">
          <Dots count={count} index={index} onPick={onPick} paused={paused} />
        </div>
      </div>

      {/* Desktop: the still, the one-sheet over its corner, the readout beside it. */}
      <div className="hidden lg:block">
        <p className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <span>{readout}</span>
          <span>{kicker}</span>
        </p>
        <Link to={href} className="group block" aria-label={`Log ${film.title}`} tabIndex={-1}>
          <span className="hud-corners block" style={{ '--inset': '-8px', '--corner-len': '18px' }}>
            <span className="img-wait relative block aspect-video overflow-hidden rounded-[4px] ring-1 ring-white/10">
              {featured.slice(0, seen).map((f, i) => (
                <img
                  key={f.tmdbId}
                  src={imageUrl(f.backdropPath, 'w780')}
                  srcSet={`${imageUrl(f.backdropPath, 'w780')} 780w, ${imageUrl(f.backdropPath, 'w1280')} 1280w`}
                  sizes="480px"
                  alt=""
                  fetchpriority={i === 0 ? 'high' : undefined}
                  className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-out group-hover:scale-[1.02] ${i === index ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
              <span aria-hidden="true" className="scanlines absolute inset-0 opacity-25" />
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void/80 to-transparent" />
            </span>
          </span>
        </Link>
        {/* Only the one-sheet climbs into the still; the readout starts below it, clear of the image. */}
        <div className="relative mt-5 flex items-start gap-6 pl-5">
          <Link to={href} className="group -mt-[26%] block w-[36%] shrink-0" aria-label={`Log ${film.title}`}>
            <span className="block overflow-hidden rounded-[4px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95)] ring-1 ring-white/15">
              <Poster key={film.tmdbId} path={film.posterPath} title={film.title} size="w342" priority className="w-full transition duration-700 ease-out group-hover:scale-[1.03]" />
            </span>
          </Link>
          <div className="min-w-0 flex-1">
            <p key={film.tmdbId} className="t-film line-clamp-2 animate-rise text-[22px] leading-tight">
              {film.title}
            </p>
            <p className="meta mt-2">{[metaLine(film.releaseYear, film.genres, { limit: 1 }), film.voteAverage ? `TMDB ${film.voteAverage.toFixed(1)}` : null].filter(Boolean).join(' · ')}</p>
            <div className="mt-4">
              <Dots count={count} index={index} onPick={onPick} paused={paused} />
            </div>
            <Link to={href} className="link-arrow mt-4">
              Log this film <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
          {item.rating ? <span className="font-semibold text-acid">{item.rating}/10</span> : null}
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

function TrendingRail({ films, total, shelf, loading }) {
  const rail = useRef(null)
  const scroll = (dir) => {
    const el = rail.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }
  const inset = 'max(var(--pad), calc((100vw - 1240px) / 2 + var(--pad)))'
  return (
    <>
      <div className="frame">
        <SectionHead
          id="trending"
          label={shelf ? 'Curated shelf' : 'This week on TMDB'}
          title={shelf ? 'Top of the shelf' : 'Trending now'}
          aside={
            <div className="flex items-center gap-2">
              <button type="button" className="btn-icon hidden border border-white/10 md:inline-flex" onClick={() => scroll(-1)} aria-label="Scroll films left">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button type="button" className="btn-icon hidden border border-white/10 md:inline-flex" onClick={() => scroll(1)} aria-label="Scroll films right">
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link to="/log" className="link-arrow ml-3">
                Search all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          }
        >
          {shelf ? `From a curated shelf of ${total} films, highest rated first. Pick one to log it.` : 'Pick one to log it.'}
        </SectionHead>
      </div>
      <ol
        ref={rail}
        className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [--pad:1.25rem] sm:gap-6 sm:[--pad:2rem]"
        style={{ paddingInline: inset, scrollPaddingLeft: inset }}
        aria-label={shelf ? 'Top rated films' : 'Trending films'}
      >
        {loading
          ? Array.from({ length: 7 }, (_, i) => (
              <li key={i} className="w-[148px] shrink-0 sm:w-[184px]">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="mt-4 h-4 w-3/4" />
              </li>
            ))
          : films.map((film, i) => (
              <li key={film.tmdbId} className="group w-[148px] shrink-0 snap-start sm:w-[184px]" data-reveal="scan" style={{ '--i': Math.min(i, 6) }}>
                <Link to={`/log?film=${film.tmdbId}`} className="block">
                  <span className="lock-on hud-corners block">
                    <span className="block overflow-hidden rounded-[4px] ring-1 ring-white/10 transition duration-500 ease-out group-hover:-translate-y-1.5 group-hover:ring-white/25">
                      <Poster path={film.posterPath} title={film.title} eager={i < 5} className="w-full transition duration-700 ease-out group-hover:scale-[1.04]" />
                    </span>
                  </span>
                  <span className="mt-4 grid grid-cols-[auto_1fr] gap-x-2.5 sm:gap-x-3">
                    <span aria-hidden="true" className="font-mono text-[20px] font-semibold leading-[1.05] tracking-[-0.04em] text-white/25 transition duration-300 group-hover:text-neon sm:text-[26px] sm:leading-[0.9]">
                      {pad2(i + 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-3 font-semibold leading-tight text-white">{film.title}</span>
                      <span className="meta mt-1 block text-[11px]">{metaLine(film.releaseYear, film.genres, { limit: 1 })}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
      </ol>
    </>
  )
}

/** One bento card: copy on top, a proportionate mini-UI anchored to the shared bottom line. */
function Step({ n, title, body, children }) {
  return (
    <li className="flex flex-col bg-void p-6 sm:p-8" data-reveal style={{ '--i': n - 1 }}>
      <span className="font-mono text-[13px] font-medium tracking-[0.1em] text-neon">{pad2(n)}</span>
      <h3 className="t-h3 mt-4">{title}</h3>
      <p className="mt-3 max-w-xs text-muted">{body}</p>
      <div aria-hidden="true" className="mt-auto pt-8">
        <div className="flex h-[176px] flex-col justify-end rounded-[4px] border border-white/[0.07] bg-white/[0.02] p-4">{children}</div>
      </div>
    </li>
  )
}

const ARRIVAL = CATALOG_BY_ID.get(329865)
const BR2049 = CATALOG_BY_ID.get(335984)

/** Card 1: the composer in miniature: a film, its status, a rating meter. */
function MiniLog() {
  return (
    <>
      <div className="flex items-center gap-3">
        <Poster path={ARRIVAL.posterPath} title="" size="w92" className="w-9 shrink-0 rounded-[3px] ring-1 ring-white/10" />
        <div className="min-w-0">
          <p className="t-film text-[15px] leading-tight">{ARRIVAL.title}</p>
          <p className="meta mt-1 text-[10.5px]">{metaLine(ARRIVAL.releaseYear, ARRIVAL.genres, { limit: 1 })}</p>
        </div>
        <StatusChip status="completed" className="ml-auto" />
      </div>
      <div className="mt-4 flex h-11 items-end gap-[3px]">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`flex-1 ${i < 8 ? 'bg-acid' : 'bg-white/[0.1]'}`} style={{ height: `${28 + i * 8}%` }} />
        ))}
      </div>
      <p className="mt-2.5 flex justify-between font-mono text-[11px] uppercase tracking-[0.12em]">
        <span className="text-muted">Rating</span>
        <span className="font-semibold text-acid">8/10 · Great</span>
      </p>
    </>
  )
}

/** Card 2: a real row from the feed. */
function MiniFeed({ item }) {
  if (!item) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }
  const s = STATUS_STYLES[item.status]
  return (
    <>
      <p className="flex items-center gap-2.5">
        <Avatar user={item.user} size={26} />
        <span className="truncate text-[14px] font-semibold text-ink">{item.user.displayName}</span>
        <span className="ml-auto shrink-0 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">{timeAgo(item.createdAt)}</span>
      </p>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-[14px]">
        <span className={`font-mono text-[10.5px] uppercase tracking-[0.12em] ${s?.text}`}>{STATUS_VERBS[item.status]}</span>
        <span className="t-film">{item.film.title}</span>
        {item.rating ? <span className="font-mono text-[12px] font-semibold text-acid">{item.rating}/10</span> : null}
      </p>
      {item.note ? <p className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-slate-300">&ldquo;{item.note}&rdquo;</p> : null}
      <p className="mt-3 flex items-center gap-1.5 font-mono text-[12px] text-plasma">
        <Heart className="h-3.5 w-3.5 fill-plasma" strokeWidth={1.75} /> {item.likes || 1}
      </p>
    </>
  )
}

/** Card 3: a pick card, as For you lays it out. */
function MiniPick() {
  return (
    <div className="flex gap-4">
      <Poster path={BR2049.posterPath} title="" size="w185" className="w-[88px] shrink-0 rounded-[3px] ring-1 ring-white/10" />
      <div className="min-w-0">
        <p className="meta text-[10.5px]">
          <span className="text-neon">Pick 01</span> · top match
        </p>
        <p className="t-film mt-1.5 text-[15px] leading-tight">{BR2049.title}</p>
        <p className="mt-2 text-[13px] leading-snug text-slate-400">You rated Arrival 8/10. Same director, same slow-burn sci-fi.</p>
      </div>
    </div>
  )
}

function FinalCall({ films, user }) {
  const wall = films.filter((f) => f.posterPath).slice(0, 12)
  return (
    <section className="frame pt-28 sm:pt-36" aria-labelledby="cta">
      <div className="relative isolate overflow-hidden rounded-[4px] border border-white/[0.08] bg-white/[0.02] px-6 py-16 sm:px-14 sm:py-20" data-reveal>
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
              <DemoButton />
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
