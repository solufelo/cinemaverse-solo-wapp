import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2, Radio, RefreshCw } from 'lucide-react'
import { STATUS_LABELS, WATCH_STATUSES } from '../../shared/constants.ts'
import ActivityCard, { ActivitySkeleton } from '../components/ActivityCard'
import { DemoButton } from '../components/Navbar'
import { Avatar, EmptyState, ErrorState, KindTag } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const PAGE = 15

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

  const players = useMemo(() => {
    const seen = new Map()
    for (const i of state.items) if (!seen.has(i.user.username)) seen.set(i.user.username, i.user)
    return [...seen.values()].slice(0, 8)
  }, [state.items])

  const setStatus = (s) => setParams(s ? { status: s } : {}, { replace: true })

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 flex items-center gap-2">
            <Radio className="h-3.5 w-3.5" /> Live
          </p>
          <h1 className="page-title">Squad feed</h1>
          <p className="mt-2 text-muted">Every log, status change and rating from players, newest first.</p>
        </div>
        <button type="button" onClick={() => load()} className="btn-quiet btn-sm" disabled={state.loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${state.loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Filter by status">
            <button type="button" role="tab" className="tab" aria-selected={!status} onClick={() => setStatus(null)}>
              All
            </button>
            {WATCH_STATUSES.map((s) => (
              <button key={s} type="button" role="tab" className="tab" aria-selected={status === s} onClick={() => setStatus(s)}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {state.loading && !state.items.length ? (
            <ActivitySkeleton count={4} />
          ) : state.error && !state.items.length ? (
            <ErrorState error={state.error} onRetry={() => load()} title="The feed didn't load" />
          ) : state.items.length === 0 ? (
            <EmptyState
              title={status ? `Nothing ${STATUS_LABELS[status].toLowerCase()} yet` : 'No posts yet'}
              action={<Link to="/log" className="btn-primary">Log a film</Link>}
            >
              {status ? 'Try another filter, or be the first.' : 'Be the first to log a film.'}
            </EmptyState>
          ) : (
            <div className={`space-y-4 transition-opacity ${state.loading ? 'opacity-60' : ''}`}>
              {state.items.map((item) => (
                <ActivityCard
                  key={item.id}
                  item={item}
                  onRemoved={(id) => setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }))}
                />
              ))}
              {state.cursor ? (
                <div className="flex justify-center pt-2">
                  <button type="button" onClick={loadMore} disabled={state.loadingMore} className="btn-ghost">
                    {state.loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {state.loadingMore ? 'Loading' : 'Load more'}
                  </button>
                </div>
              ) : (
                <p className="pt-4 text-center font-display text-[11px] uppercase tracking-[0.3em] text-muted">End of feed</p>
              )}
              {state.error && state.items.length ? <p className="text-center text-sm text-ember">{state.error.message}</p> : null}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {!user ? (
            <div className="panel glow-border p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">Join the feed</h2>
              <p className="mt-2 text-muted">Log a film in two clicks with a guest account, or sign up to keep your history.</p>
              <div className="mt-4 grid gap-2">
                <DemoButton className="btn-primary w-full">Try the demo</DemoButton>
                <Link to="/signup" className="btn-quiet w-full">
                  Create account
                </Link>
              </div>
            </div>
          ) : (
            <div className="panel p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">What are you watching?</h2>
              <Link to="/log" className="btn-primary mt-4 w-full">
                Log a film
              </Link>
            </div>
          )}
          {players.length ? (
            <div className="panel p-5">
              <h2 className="mb-3 font-display text-[11px] uppercase tracking-[0.25em] text-muted">Active players</h2>
              <ul className="space-y-1">
                {players.map((p) => (
                  <li key={p.username}>
                    <Link to={`/u/${p.username}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/5">
                      <Avatar user={p} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">{p.displayName}</span>
                        <span className="block truncate text-sm text-muted">@{p.username}</span>
                      </span>
                      <KindTag kind={p.kind} />
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
