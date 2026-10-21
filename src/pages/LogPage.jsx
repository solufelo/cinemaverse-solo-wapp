import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Search, Send, X } from 'lucide-react'
import { NOTE_MAX, STATUS_LABELS } from '../../shared/constants.ts'
import FilmCard, { FilmGridSkeleton } from '../components/FilmCard'
import StatusPicker from '../components/StatusPicker'
import { EmptyState, Poster, RatingInput } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { getFilm, getTrending, searchFilms } from '../lib/tmdb'

export default function LogPage() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [results, setResults] = useState({ films: [], source: null, loading: true })
  const [selected, setSelected] = useState(null)
  const list = useApi('/watchlist')
  const composerRef = useRef(null)

  const mine = useMemo(() => new Map((list.data?.entries ?? []).map((e) => [e.tmdbId, e])), [list.data])

  // Results: trending when the box is empty, debounced TMDB search otherwise.
  useEffect(() => {
    const c = new AbortController()
    const q = query.trim()
    setResults((r) => ({ ...r, loading: true }))
    const t = setTimeout(
      () => {
        ;(q ? searchFilms(q, c.signal) : getTrending(c.signal))
          .then((r) => setResults({ films: r.films.slice(0, q ? 20 : 12), source: r.source, loading: false }))
          .catch(() => {})
      },
      q ? 300 : 0,
    )
    return () => {
      clearTimeout(t)
      c.abort()
    }
  }, [query])

  // Deep link: /log?film=693134 preselects that film (from the feed, home or recommendations).
  const filmParam = params.get('film')
  const selectedId = useRef(null)
  selectedId.current = selected?.tmdbId ?? null
  useEffect(() => {
    const id = Number(filmParam)
    if (!id || selectedId.current === id) return
    const c = new AbortController()
    getFilm(id, c.signal)
      .then((film) => film && setSelected(film))
      .catch(() => {})
    return () => c.abort()
  }, [filmParam])

  const select = (film) => {
    setSelected(film)
    setParams({ film: String(film.tmdbId), ...(query ? { q: query } : {}) }, { replace: true })
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setTimeout(() => composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }

  const onLogged = (entry) => {
    list.setData((d) => {
      const entries = (d?.entries ?? []).filter((e) => e.tmdbId !== entry.tmdbId)
      return { ...(d ?? {}), entries: [entry, ...entries] }
    })
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="eyebrow mb-2">Log status</p>
        <h1 className="page-title">What are you watching?</h1>
        <p className="mt-2 text-muted">Search TMDB, pick a film, set your status. It lands on your watchlist and the feed.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <label htmlFor="film-search" className="sr-only">
            Search films
          </label>
          <div className="relative mb-6">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="film-search"
              type="search"
              className="input-field py-3.5 pl-12 pr-10 text-lg"
              placeholder="Search films…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {results.loading && query ? <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" /> : null}
          </div>
          <p className="mb-4 font-display text-[11px] uppercase tracking-[0.25em] text-muted">
            {query.trim() ? `Results for “${query.trim()}”` : 'Trending now'}
            {results.source === 'catalog' ? ' · offline catalog' : ''}
          </p>

          {results.loading && !results.films.length ? (
            <FilmGridSkeleton count={8} className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" />
          ) : results.films.length === 0 ? (
            <EmptyState icon={Search} title="No films found">
              {results.source === 'catalog'
                ? 'Search is limited to the offline catalog until a TMDB key is configured.'
                : 'Check the spelling or try the original title.'}
            </EmptyState>
          ) : (
            <div className={`grid grid-cols-2 gap-4 transition-opacity sm:grid-cols-3 xl:grid-cols-4 ${results.loading ? 'opacity-60' : ''}`}>
              {results.films.map((film) => (
                <FilmCard
                  key={film.tmdbId}
                  film={film}
                  selected={selected?.tmdbId === film.tmdbId}
                  status={mine.get(film.tmdbId)?.status}
                  onSelect={select}
                />
              ))}
            </div>
          )}
        </div>

        <div ref={composerRef} className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
          {selected ? (
            <Composer
              key={selected.tmdbId}
              film={selected}
              existing={mine.get(selected.tmdbId)}
              onClose={() => {
                setSelected(null)
                setParams(query ? { q: query } : {}, { replace: true })
              }}
              onLogged={(entry) => {
                onLogged(entry)
                toast.push({
                  message: `${entry.title}: ${STATUS_LABELS[entry.status]}.`,
                  link: { to: '/feed', label: 'See it in the feed' },
                })
              }}
            />
          ) : (
            <div className="panel flex flex-col items-center px-6 py-14 text-center">
              <span className="font-display text-[11px] uppercase tracking-[0.3em] text-neon">Step 1</span>
              <p className="mt-2 text-lg text-slate-300">Pick a film from the grid.</p>
              <p className="mt-1 text-muted">Then set your status, rating and a quick take.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function Composer({ film, existing, onClose, onLogged }) {
  const toast = useToast()
  const [status, setStatus] = useState(existing?.status ?? 'watching')
  const [rating, setRating] = useState(existing?.rating ?? null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { entry } = await api(`/watchlist/${film.tmdbId}`, {
        method: 'PUT',
        body: {
          film: {
            title: film.title,
            posterPath: film.posterPath,
            backdropPath: film.backdropPath,
            releaseYear: film.releaseYear,
            genres: film.genres ?? [],
          },
          status,
          rating,
          note: note.trim(),
        },
      })
      setNote('')
      onLogged(entry)
    } catch (err) {
      setError(err.message)
      if (err.status === 401) toast.push({ tone: 'error', message: 'Your session ended. Sign in again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="panel glow-border animate-rise overflow-hidden" aria-label={`Log ${film.title}`}>
      <div className="relative flex gap-4 border-b border-white/[0.07] p-5">
        <Poster path={film.posterPath} title={film.title} size="w185" className="w-20 shrink-0 rounded-lg ring-1 ring-white/10" eager />
        <div className="min-w-0 pr-6">
          <p className="eyebrow">{existing ? `On your list · ${STATUS_LABELS[existing.status]}` : 'Selected'}</p>
          <h2 className="mt-1 font-display text-lg font-bold leading-tight text-white">{film.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {[film.releaseYear, ...(film.genres ?? []).slice(0, 2)].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded p-1 text-muted hover:text-white" aria-label="Clear selection">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <span id="status-label" className="field-label">
            Status
          </span>
          <StatusPicker value={status} onChange={setStatus} labelledBy="status-label" />
        </div>
        <div>
          <span id="rating-label" className="field-label">
            Rating <span className="normal-case tracking-normal">(optional)</span>
          </span>
          <RatingInput value={rating} onChange={setRating} id="rating-label" />
        </div>
        <div>
          <label htmlFor="note" className="field-label flex justify-between">
            <span>Take</span>
            <span className={`tabular-nums ${note.length > NOTE_MAX - 20 ? 'text-plasma' : ''}`}>
              {note.length}/{NOTE_MAX}
            </span>
          </label>
          <textarea
            id="note"
            className="input-field min-h-24 resize-none"
            placeholder="Quick take for the feed…"
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {error ? (
          <p role="alert" className="rounded-lg border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? 'Posting…' : existing ? 'Update & share' : 'Share to feed'}
        </button>
      </div>
    </form>
  )
}
