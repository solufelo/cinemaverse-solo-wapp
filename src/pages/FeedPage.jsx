import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2, Plus, RefreshCw } from 'lucide-react'
import { STATUS_LABELS, STATUS_VERBS, WATCH_STATUSES } from '../../shared/constants.ts'
import ActivityCard, { ActivitySkeleton } from '../components/ActivityCard'
import { DemoButton } from '../components/Navbar'
import { Avatar, EmptyState, ErrorState, KindTag, STATUS_STYLES, StatusMark } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { groupByDay, plural, timeAgo } from '../lib/format'

const PAGE = 15

function RefreshButton({ loading, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} className={`btn-icon shrink-0 sm:w-auto sm:gap-2 sm:rounded-full sm:px-3.5 ${className}`} disabled={loading} aria-label="Refresh feed">
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] sm:inline">Refresh</span>
    </button>
  )
}

export default function FeedPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const status = WATCH_STATUSES.includes(params.get('status')) ? params.get('status') : null
  const [state, setState] = useState({ items: [], cursor: null, loading: true, loadingMore: false, error: null })

  const query = (cursor) => {
    const qs = new URLSearchParams({ limit: String(PAGE) })
    if (status) qs.set('status', status)
    if (cursor) qs.set('cursor', cursor)
    return `/feed?${qs}`
  }

  const load = async (signal) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const page = await api(query(), { signal })
      setState({ items: page.items, cursor: page.nextCursor, loading: false, loadingMore: false, error: null })
    } catch (error) {
      if (error.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error }))
    }
  }

  useEffect(() => {
    const c = new AbortController()
    load(c.signal)
    return () => c.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const loadMore = async () => {
    setState((s) => ({ ...s, loadingMore: true }))
    try {
      const page = await api(query(state.cursor))
      setState((s) => ({ ...s, items: [...s.items, ...page.items], cursor: page.nextCursor, loadingMore: false }))
    } catch (error) {
      setState((s) => ({ ...s, loadingMore: false, error }))
    }
  }

  // Each player once, with their latest post (the feed is newest first).
  const players = useMemo(() => {
    const seen = new Map()
    for (const i of state.items) if (!seen.has(i.user.username)) seen.set(i.user.username, i)
    return [...seen.values()].slice(0, 8)
  }, [state.items])
  const days = useMemo(() => groupByDay(state.items), [state.items])

  const setStatus = (s) => setParams(s ? { status: s } : {}, { replace: true })

  return (
    <main>
      <header className="frame grid gap-8 pb-10 pt-10 sm:pb-12 sm:pt-16 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <p className="hud-label" style={{ '--mark': '#ff2d95' }}>
              Live <span className="text-slate-600">/</span> newest first
            </p>
            {/* On phones the filter row is full, so refresh moves up here. */}
            <RefreshButton loading={state.loading} onClick={() => load()} className="-my-2 sm:hidden" />
          </div>
          <h1 className="t-h1 mt-5">Squad feed</h1>
          <p className="mt-4 max-w-md text-muted">Every log, status change and rating from the squad, as it happens.</p>
        </div>
        {players.length ? (
          <div className="hidden items-center gap-5 sm:flex lg:col-span-5 lg:justify-end">
            <div className="flex gap-1.5">
              {players.slice(0, 6).map((p) => (
                <Avatar key={p.user.username} user={p.user} size={30} />
              ))}
            </div>
            <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.12em] text-muted">
              <span className="text-white">{plural(players.length, 'player')}</span> on the feed
              <br />
              Last post <span className="text-white">{timeAgo(state.items[0].createdAt)}</span>
            </p>
          </div>
        ) : null}
      </header>

      <div className="sticky top-16 z-30 border-b border-white/[0.07] bg-void/85 backdrop-blur-xl">
        <div className="frame flex items-center gap-4">
          {/* Phones: a five-cell segmented control (marker over label) that fits 390px. Wider: the underline row. */}
          <div className="tabs tabs-seg min-w-0 flex-1 border-b-0" role="tablist" aria-label="Filter by status">
            <button type="button" role="tab" className="tab" aria-selected={!status} onClick={() => setStatus(null)}>
              <span className="h-2 w-2 bg-current sm:hidden" aria-hidden="true" />
              All
            </button>
            {WATCH_STATUSES.map((s) => (
              <button key={s} type="button" role="tab" className="tab" aria-selected={status === s} onClick={() => setStatus(s)}>
                <StatusMark status={s} className={STATUS_STYLES[s].text} />
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <RefreshButton loading={state.loading} onClick={() => load()} className="hidden sm:inline-flex" />
        </div>
      </div>

      <div className="frame grid gap-14 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          {!user ? (
            <div className="mt-6 flex items-center justify-between gap-4 border-l-2 border-neon bg-white/[0.03] py-3 pl-4 pr-3 lg:hidden">
              <p className="text-[15px] leading-snug text-slate-300">Log a film in two taps.</p>
              <DemoButton className="btn-primary btn-sm shrink-0">Try the demo</DemoButton>
            </div>
          ) : null}

          {state.loading && !state.items.length ? (
            <ActivitySkeleton count={5} />
          ) : state.error && !state.items.length ? (
            <div className="pt-8">
              <ErrorState error={state.error} onRetry={() => load()} title="The feed is down for a moment" />
            </div>
          ) : state.items.length === 0 ? (
            <div className="pt-8">
              <EmptyState
                label={status ? `Filter: ${STATUS_LABELS[status]}` : 'Channel quiet'}
                title={status ? `Nothing ${STATUS_LABELS[status].toLowerCase()} yet` : 'No posts yet'}
                action={
                  <>
                    {status ? (
                      <button type="button" className="btn-ghost" onClick={() => setStatus(null)}>
                        Show everything
                      </button>
                    ) : null}
                    <Link to="/log" className="btn-primary">
                      Log a film
                    </Link>
                  </>
                }
              >
                {status ? 'Nobody in the squad has a film on this status right now.' : 'Be the first to log a film.'}
              </EmptyState>
            </div>
          ) : (
            <div className={`transition-opacity duration-300 ${state.loading ? 'opacity-50' : ''}`}>
              {days.map((day) => (
                <section key={day.key} aria-label={day.label} className="[&:first-child>h2]:pt-8">
                  <h2 className="flex items-center gap-4 pb-1 pt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-white">
                    {day.label}
                    <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" aria-hidden="true" />
                    <span className="text-muted">{plural(day.items.length, 'post')}</span>
                  </h2>
                  {day.items.map((item) => (
                    <ActivityCard
                      key={item.id}
                      item={item}
                      onRemoved={(id) => setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }))}
                    />
                  ))}
                </section>
              ))}
              {state.cursor ? (
                <div className="flex justify-center pt-12">
                  <button type="button" onClick={loadMore} disabled={state.loadingMore} className="btn-quiet min-w-48">
                    {state.loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {state.loadingMore ? 'Loading' : 'Load more'}
                  </button>
                </div>
              ) : (
                <p className="flex items-center gap-4 pt-12 font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
                  <span className="h-px flex-1 bg-white/10" /> End of feed <span className="h-px flex-1 bg-white/10" />
                </p>
              )}
              {state.error && state.items.length ? <p className="pt-4 text-center text-sm text-ember">{state.error.message}</p> : null}
            </div>
          )}
        </div>

        <aside className="hidden space-y-12 pt-10 lg:col-span-4 lg:block lg:sticky lg:top-36 lg:self-start">
          {!user ? (
            <div className="hud-corners rounded-[4px] border border-white/[0.07] bg-white/[0.02] p-7" style={{ '--inset': '-1px', '--corner': 'rgba(0,245,255,.8)' }}>
              <p className="hud-label">Join the feed</p>
              <p className="t-h3 mt-5 leading-tight">Log a film in two clicks.</p>
              <p className="mt-3 text-muted">A guest account takes one click. Sign up to keep your history.</p>
              <div className="mt-7 grid gap-2">
                <DemoButton className="btn-primary w-full">Try the demo</DemoButton>
                <Link to="/signup" className="btn-ghost w-full">
                  Create account
                </Link>
              </div>
            </div>
          ) : (
            <div className="hud-corners rounded-[4px] border border-white/[0.07] bg-white/[0.02] p-7" style={{ '--inset': '-1px', '--corner': 'rgba(0,245,255,.8)' }}>
              <p className="hud-label">Your move</p>
              <p className="t-h3 mt-5 leading-tight">What are you watching?</p>
              <Link to="/log" className="btn-primary mt-7 w-full">
                <Plus className="h-4 w-4" /> Log a film
              </Link>
            </div>
          )}
          {players.length ? (
            <div>
              <p className="hud-label mb-4">Now playing</p>
              <ul className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
                {players.map(({ user: p, status: s, film }) => (
                  <li key={p.username}>
                    <Link to={`/u/${p.username}`} className="group flex items-center gap-3 py-3 transition">
                      <Avatar user={p} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-semibold text-ink transition group-hover:text-neon">{p.displayName}</span>
                          <KindTag kind={p.kind} />
                        </span>
                        <span className="block truncate text-[13px] text-muted">
                          <span className={`font-mono text-[10.5px] uppercase tracking-[0.1em] ${STATUS_STYLES[s].text}`}>{STATUS_VERBS[s]}</span> {film.title}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  )
}
