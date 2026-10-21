import { CATALOG } from '../../shared/catalog.ts'
import { TMDB_GENRES } from '../../shared/constants.ts'
import { getHealth } from './api'

const IMG = 'https://image.tmdb.org/t/p/'

export function imageUrl(path, size = 'w342') {
  return path ? `${IMG}${size}${path}` : null
}

/**
 * Where the subject sits in each catalogue backdrop (CSS object-position), so a crop for a
 * narrow or wide banner keeps the face or the action instead of a torso. Anything else
 * (live TMDB films) gets the default, which favours the upper middle where faces usually are.
 */
const FOCUS = {
  693134: '42% 30%',
  569094: '62% 45%',
  4977: '55% 35%',
  496243: '50% 40%',
  940721: '45% 45%',
  244786: '20% 40%',
  438631: '62% 40%',
  335984: '45% 30%',
  238: '35% 30%',
  155: '30% 30%',
  78: '40% 35%',
  545611: '45% 40%',
}
export const backdropFocus = (tmdbId) => FOCUS[tmdbId] ?? '50% 35%'

/** TMDB result -> the film shape the app and API use. */
export function normalizeFilm(m) {
  return {
    tmdbId: m.id,
    title: m.title,
    releaseYear: Number((m.release_date || '').slice(0, 4)) || null,
    posterPath: m.poster_path || null,
    backdropPath: m.backdrop_path || null,
    genres: (m.genre_ids || m.genres?.map((g) => g.id) || []).map((id) => TMDB_GENRES[id]).filter(Boolean),
    voteAverage: typeof m.vote_average === 'number' ? m.vote_average : null,
  }
}

/** False when the server says it has no TMDB key or upstream, so we skip a request that can only fail. */
async function tmdbConfigured() {
  try {
    return (await getHealth()).tmdb !== false
  } catch {
    return true
  }
}

async function proxy(path, params = {}, signal) {
  if (!(await tmdbConfigured())) throw new Error('TMDB is not configured')
  const qs = new URLSearchParams({ path, ...params })
  const res = await fetch(`/.netlify/functions/tmdb?${qs}`, { signal })
  if (!res.ok) throw new Error(`TMDB proxy ${res.status}`)
  return res.json()
}

/**
 * Trending films. Falls back to the bundled offline catalog when the proxy has no key
 * or TMDB is down, and says which one it used so the UI can label it.
 */
export async function getTrending(signal) {
  try {
    const data = await proxy('trending/movie/week', {}, signal)
    const films = (data.results || []).map(normalizeFilm)
    if (films.length) return { films, source: 'tmdb' }
  } catch (err) {
    if (err.name === 'AbortError') throw err
  }
  return { films: [...CATALOG].sort((a, b) => b.voteAverage - a.voteAverage), source: 'catalog' }
}

export async function searchFilms(query, signal) {
  const q = query.trim()
  if (!q) return { films: [], source: 'tmdb' }
  try {
    const data = await proxy('search/movie', { query: q }, signal)
    return { films: (data.results || []).map(normalizeFilm), source: 'tmdb' }
  } catch (err) {
    if (err.name === 'AbortError') throw err
    const needle = q.toLowerCase()
    return { films: CATALOG.filter((f) => f.title.toLowerCase().includes(needle)), source: 'catalog' }
  }
}

export async function getFilm(tmdbId, signal) {
  const known = CATALOG.find((f) => f.tmdbId === tmdbId)
  try {
    const data = await proxy(`movie/${tmdbId}`, {}, signal)
    if (data?.id) return normalizeFilm(data)
  } catch (err) {
    if (err.name === 'AbortError') throw err
  }
  return known || null
}
