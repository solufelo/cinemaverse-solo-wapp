import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ListChecks, Radio, Sparkles, UserRound } from 'lucide-react'
import ActivityCard, { ActivitySkeleton } from '../components/ActivityCard'
import FilmCard, { FilmGridSkeleton } from '../components/FilmCard'
import { DemoButton } from '../components/Navbar'
import { Avatar, EmptyState, ErrorState, Poster, Skeleton, StatusChip } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { timeAgo } from '../lib/format'
import { getTrending } from '../lib/tmdb'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const feed = useApi('/feed?limit=6')
  const [trending, setTrending] = useState({ films: [], source: null, loading: true })

  useEffect(() => {
    const c = new AbortController()
    getTrending(c.signal)
      .then((t) => setTrending({ ...t, loading: false }))
      .catch(() => {})
    return () => c.abort()
  }, [])

  const items = feed.data?.items ?? []
  const mosaic = trending.films.filter((f) => f.posterPath).slice(0, 16)

  return (
    <main>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <PosterMosaic films={mosaic} />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:pb-24">
          <div className="animate-rise">
            <p className="eyebrow mb-4">Player One — Online</p>
            <h1 className="font-display text-[2.6rem] font-black uppercase leading-[1.02] text-white sm:text-6xl lg:text-[3.9rem]">
              Log films.
              <br />
              <span className="bg-gradient-to-r from-neon via-cyan-300 to-plasma bg-clip-text text-transparent">
                Share your watch status.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              CinemaVerse is a social film log on top of TMDB. Mark what you&apos;re watching, finished, queued or dropped,
              rate it out of ten, and see what your squad is playing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link to="/log" className="btn-primary">
                    Log a film <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/watchlist" className="btn-ghost">
                    <ListChecks className="h-4 w-4" /> Your watchlist
                  </Link>
                </>
              ) : (
                <>
                  <DemoButton>Try it — no sign-up</DemoButton>
                  <Link to="/feed" className="btn-ghost">
                    <Radio className="h-4 w-4" /> View live feed
                  </Link>
                </>
              )}
            </div>
            {!user ? (
              <p className="mt-4 text-sm text-muted">
                The demo opens a 24-hour guest account.{' '}
                <Link to="/signup" className="text-neon hover:underline">
                  Create a real one
                </Link>{' '}
                to keep your log.
              </p>
            ) : null}
          </div>

          <LivePanel feed={feed} items={items.slice(0, 4)} />
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">{trending.source === 'catalog' ? 'Offline catalog' : 'This week on TMDB'}</p>
            <h2 className="font-display text-2xl font-bold uppercase text-white">Trending films</h2>
            <p className="mt-1 text-muted">
              {trending.source === 'catalog'
                ? 'TMDB is not configured here, so these come from the built-in catalog.'
                : 'Pick one to log your status.'}
            </p>
          </div>
          <Link to="/log" className="btn-ghost btn-sm hidden shrink-0 sm:inline-flex">
            Search all films
          </Link>
        </div>
        {trending.loading ? (
          <FilmGridSkeleton count={10} className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {trending.films.slice(0, 10).map((film, i) => (
              <FilmCard key={film.tmdbId} film={film} eager={i < 5} onSelect={() => navigate(`/log?film=${film.tmdbId}`)} />
            ))}
          </div>
        )}
      </section>

      {/* Recent feed */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Squad activity</p>
            <h2 className="font-display text-2xl font-bold uppercase text-white">Recent feed</h2>
          </div>
          <Link to="/feed" className="inline-flex items-center gap-1 text-sm font-semibold text-neon hover:underline">
            Open the feed <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {feed.loading && !feed.data ? (
          <ActivitySkeleton count={2} />
        ) : feed.error ? (
          <ErrorState error={feed.error} onRetry={feed.reload} title="The feed didn't load" />
        ) : items.length === 0 ? (
          <EmptyState title="Quiet in here" action={<Link to="/log" className="btn-primary">Log the first film</Link>}>
            Nobody has logged a film yet.
          </EmptyState>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.slice(0, 4).map((item) => (
              <ActivityCard key={item.id} item={item} onRemoved={() => feed.reload()} />
            ))}
          </div>
        )}
      </section>

      {/* What it does */}
      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [ListChecks, 'Track every film', 'One list, four states: watching, completed, queued, dropped. Ratings out of ten and a 280-character take.'],
            [UserRound, 'Public profile', 'Your shelves, stats and favourite genres on a shareable page at /u/your-name.'],
            [Sparkles, 'Picks for you', 'AI recommendations through OpenRouter, with a built-in taste-match engine when no key is set.'],
          ].map(([Icon, title, body]) => (
            <div key={title} className="panel p-6">
              <Icon className="h-5 w-5 text-neon" />
              <h3 className="mt-4 font-display text-sm font-bold uppercase tracking-wider text-white">{title}</h3>
              <p className="mt-2 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function LivePanel({ feed, items }) {
  return (
    <div className="panel glow-border relative animate-rise p-5 [animation-delay:120ms] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-display text-[12px] uppercase tracking-[0.25em] text-neon">Live squad activity</span>
        <span className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.25em] text-plasma">
          <span className="h-2 w-2 animate-blip rounded-full bg-plasma shadow-plasma" /> Live
        </span>
      </div>
      {feed.loading && !feed.data ? (
        <ul className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="flex items-center gap-3">
              <Skeleton className="h-14 w-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </li>
          ))}
        </ul>
      ) : feed.error ? (
        <p className="text-sm text-muted">Live activity is unavailable right now.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={`/u/${item.user.username}`}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-void/60 p-2.5 transition hover:border-neon/30"
              >
                <Poster path={item.film.posterPath} title={item.film.title} size="w92" className="w-10 shrink-0 rounded" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] text-slate-300">
                    <span className="font-semibold text-white">@{item.user.username}</span> — {item.film.title}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <StatusChip status={item.status} />
                    {timeAgo(item.createdAt)}
                  </p>
                </div>
                <Avatar user={item.user} size={26} className="hidden sm:inline-flex" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Slow-drifting wall of posters behind the hero; purely decorative. */
function PosterMosaic({ films }) {
  if (films.length < 8) return null
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -inset-x-20 top-6 flex -rotate-6 flex-col gap-4 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]">
        {[0, 1, 2].map((r) => {
          // Each row repeats its sequence twice so the -50% drift loops seamlessly.
          const seq = [...films.slice(r * 5), ...films.slice(0, r * 5)]
          return (
            <div key={r} className="flex w-max animate-drift gap-4" style={{ animationDuration: `${110 + r * 30}s`, animationDirection: r % 2 ? 'reverse' : 'normal' }}>
              {[...seq, ...seq].map((f, i) => (
                <Poster key={`${f.tmdbId}-${i}`} path={f.posterPath} title="" size="w185" className="w-32 rounded-lg sm:w-40" />
              ))}
            </div>
          )
        })}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,245,255,0.14),transparent_45%),radial-gradient(circle_at_85%_5%,rgba(255,45,149,0.12),transparent_40%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-void via-void/80 to-void/20" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent" />
    </div>
  )
}
