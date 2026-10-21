import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Crosshair, Loader2, Search, Send, X } from 'lucide-react'
import { NOTE_MAX, STATUS_LABELS } from '../../shared/constants.ts'
import FilmCard, { FilmGridSkeleton } from '../components/FilmCard'
import StatusPicker from '../components/StatusPicker'
import { EmptyState, Poster, RatingInput } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { metaLine, plural } from '../lib/format'
import { getFilm, getTrending, imageUrl, searchFilms } from '../lib/tmdb'

const isPhone = () => window.matchMedia('(max-width: 1023px)').matches

export default function LogPage() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [results, setResults] = useState({ films: [], source: null, loading: true })
  const [selected, setSelected] = useState(null)
  const list = useApi('/watchlist')
  const searchRef = useRef(null)

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

  // "/" focuses search, the way film sites do.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.target.closest?.('input, textarea')) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // On phones the composer is a bottom sheet: keep the page behind it still.
  useEffect(() => {
    if (!selected || !isPhone()) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [selected])

  const select = (film) => {
    setSelected(film)
    setParams({ film: String(film.tmdbId), ...(query ? { q: query } : {}) }, { replace: true })
  }

  const close = () => {
    setSelected(null)
    setParams(query ? { q: query } : {}, { replace: true })
  }

  const onLogged = (entry) => {
    list.setData((d) => {
      const entries = (d?.entries ?? []).filter((e) => e.tmdbId !== entry.tmdbId)
      return { ...(d ?? {}), entries: [entry, ...entries] }
    })
    toast.push({
      message: `${entry.title}: ${STATUS_LABELS[entry.status]}.`,
      link: { to: '/feed', label: 'See it in the feed' },
    })
    if (isPhone()) close()
  }

  return (
    <main className="frame pt-10 sm:pt-14">
      <header>
        <p className="hud-label">Log a film</p>
        <h1 className="t-h1 mt-5 text-[clamp(1.9rem,1.1rem+2.3vw,3.25rem)]">What are you watching?</h1>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-8">
          <label htmlFor="film-search" className="sr-only">
            Search films
          </label>
          <div className="group relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted transition group-focus-within:text-neon" />
            <input
              ref={searchRef}
              id="film-search"
              type="search"
              className="input-field h-16 pl-14 pr-24 text-[19px] [&::-webkit-search-cancel-button]:hidden"
              placeholder="Search films"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
              {results.loading && query ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : null}
              {query ? (
                <button type="button" onClick={() => setQuery('')} className="btn-icon h-8 w-8" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <kbd className="hidden rounded border border-white/15 px-2 py-0.5 font-mono text-[11px] text-muted sm:inline">/</kbd>
              )}
            </span>
          </div>
          <p className="meta mb-6 mt-8 flex items-center gap-3" data-source={results.source ?? undefined}>
            <span className="text-slate-300">{query.trim() ? `Results for “${query.trim()}”` : results.source === 'catalog' ? 'Top of the shelf' : 'Trending now'}</span>
            {!results.loading ? (
              <>
                <span className="h-1 w-1 bg-white/25" /> {plural(results.films.length, 'film')}
              </>
            ) : null}
          </p>

          {results.loading && !results.films.length ? (
            <FilmGridSkeleton count={8} className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4" />
          ) : results.films.length === 0 ? (
            <EmptyState
              icon={Search}
              label="No match"
              title="No films found"
              action={
                <button type="button" className="btn-ghost" onClick={() => setQuery('')}>
                  Clear search
                </button>
              }
            >
              {results.source === 'catalog' ? 'Nothing on the shelf matches that. Try Dune, Arrival or Parasite.' : 'Check the spelling or try the original title.'}
            </EmptyState>
          ) : (
            <div className={`grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity duration-300 sm:grid-cols-3 xl:grid-cols-4 ${results.loading ? 'opacity-50' : ''}`}>
              {results.films.map((film, i) => (
                <FilmCard key={film.tmdbId} film={film} eager={i < 4} selected={selected?.tmdbId === film.tmdbId} status={mine.get(film.tmdbId)?.status} onSelect={select} />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          {selected ? (
            <>
              <div className="fixed inset-0 z-[55] animate-fade bg-void/75 backdrop-blur-sm lg:hidden" onClick={close} aria-hidden="true" />
              <div className="fixed inset-x-0 bottom-0 z-[56] max-h-[90svh] overflow-y-auto overscroll-contain rounded-t-[12px] max-lg:animate-sheet-in lg:sticky lg:inset-auto lg:top-24 lg:z-auto lg:max-h-none lg:overflow-visible lg:rounded-none">
                <Composer key={selected.tmdbId} film={selected} existing={mine.get(selected.tmdbId)} onClose={close} onLogged={onLogged} />
              </div>
            </>
          ) : (
            <div className="sticky top-24 hidden lg:block">
              <EmptyState icon={Crosshair} label="Composer idle" title="No film locked">
                Pick a poster. Then set a status, a rating and a quick take.
              </EmptyState>
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
  const backdrop = imageUrl(film.backdropPath, 'w780')

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
    <form onSubmit={submit} className="overflow-hidden border border-white/10 bg-panel max-lg:rounded-t-[12px] max-lg:border-b-0 lg:rounded-[4px] lg:animate-rise" aria-label={`Log ${film.title}`}>
      <div className="relative h-32 overflow-hidden sm:h-40">
        {backdrop ? <img src={backdrop} alt="" className="h-full w-full object-cover opacity-70" /> : <div className="grid-bg h-full w-full" />}
        <div className="scanlines absolute inset-0 opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/40 to-transparent" />
        <span aria-hidden="true" className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-white/30 lg:hidden" />
        <button type="button" onClick={onClose} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-void/70 text-slate-300 backdrop-blur transition hover:text-white" aria-label="Clear selection">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="relative -mt-14 flex items-end gap-4 px-5 sm:px-6">
        <Poster path={film.posterPath} title={film.title} size="w185" className="w-20 shrink-0 rounded-[4px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.9)] ring-1 ring-white/15 sm:w-24" eager />
        <div className="min-w-0 pb-1">
          <p className="hud-label" style={existing ? { '--mark': '#b8ff00' } : undefined}>
            {existing ? `On your list · ${STATUS_LABELS[existing.status]}` : 'Locked in'}
          </p>
          <h2 className="t-film mt-2 text-[21px] leading-tight">{film.title}</h2>
          <p className="meta mt-1.5">{metaLine(film.releaseYear, film.genres, { max: 26 })}</p>
        </div>
      </div>

      <div className="space-y-7 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-7 sm:p-6 sm:pb-6">
        <div>
          <span id="status-label" className="field-label">
            Status
          </span>
          <StatusPicker value={status} onChange={setStatus} labelledBy="status-label" />
        </div>
        <div>
          <span id="rating-label" className="field-label">
            Rating <span className="normal-case tracking-normal text-slate-500">(optional)</span>
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
            placeholder="A line for the feed"
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {error ? (
          <p role="alert" className="border-l-2 border-ember bg-ember/10 px-3 py-2 text-sm text-ember">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? 'Posting…' : existing ? 'Update & share' : 'Share to feed'}
        </button>
      </div>
    </form>
  )
}
