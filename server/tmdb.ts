import type { CatalogFilm } from '../shared/catalog.ts'
import { TMDB_GENRES } from '../shared/constants.ts'
import type { Env } from './router.ts'

/**
 * TMDB proxy. Keeps the API key on the server and only forwards the read-only
 * endpoints the app uses (it used to forward any path the browser asked for).
 */
const ALLOWED_PATHS = [
  /^trending\/movie\/(day|week)$/,
  /^search\/movie$/,
  /^movie\/\d{1,9}$/,
  /^movie\/\d{1,9}\/(recommendations|similar)$/,
  /^discover\/movie$/,
  /^genre\/movie\/list$/,
]
const ALLOWED_PARAMS = new Set(['query', 'page', 'language', 'year', 'with_genres', 'sort_by'])

const reply = (status: number, body: unknown, cache = false) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache ? 'public, max-age=300' : 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })

export function buildTmdbQuery(url: URL): { path: string; params: URLSearchParams } | { error: string } {
  const path = url.searchParams.get('path') || 'trending/movie/week'
  if (!ALLOWED_PATHS.some((re) => re.test(path))) return { error: 'That TMDB endpoint is not allowed.' }
  const params = new URLSearchParams()
  for (const [k, v] of url.searchParams) {
    if (k === 'path') continue
    if (!ALLOWED_PARAMS.has(k)) return { error: `Parameter "${k}" is not allowed.` }
    if (v.length > 100) return { error: `Parameter "${k}" is too long.` }
    params.set(k, v)
  }
  params.set('include_adult', 'false')
  return { path, params }
}

export async function handleTmdb(request: Request, env: Env = process.env, fetchImpl: typeof fetch = fetch) {
  if (request.method !== 'GET') return reply(405, { error: 'Method not allowed' })
  const q = buildTmdbQuery(new URL(request.url))
  if ('error' in q) return reply(400, { error: q.error })

  // Local convenience: with no key, forward to an existing deployment of this same proxy.
  if (!env.TMDB_API_KEY && env.TMDB_UPSTREAM) {
    const upstream = new URL('/.netlify/functions/tmdb', env.TMDB_UPSTREAM)
    upstream.searchParams.set('path', q.path)
    q.params.forEach((v, k) => upstream.searchParams.set(k, v))
    upstream.searchParams.delete('include_adult')
    return forward(upstream, fetchImpl)
  }
  if (!env.TMDB_API_KEY) return reply(503, { error: 'TMDB_API_KEY is not configured', fallback: true })

  const target = new URL(`https://api.themoviedb.org/3/${q.path}`)
  q.params.forEach((v, k) => target.searchParams.set(k, v))
  target.searchParams.set('api_key', env.TMDB_API_KEY)
  return forward(target, fetchImpl)
}

async function forward(target: URL, fetchImpl: typeof fetch) {
  try {
    const res = await fetchImpl(target, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    return reply(res.status, data, res.ok)
  } catch {
    return reply(502, { error: 'TMDB did not respond', fallback: true })
  }
}

/** Server-side lookup used to attach posters to AI picks. Null when TMDB isn't configured. */
export async function tmdbSearchFirst(
  title: string,
  year: number | null,
  env: Env,
  fetchImpl: typeof fetch,
): Promise<CatalogFilm | null> {
  if (!env.TMDB_API_KEY && !env.TMDB_UPSTREAM) return null
  const url = new URL('http://internal/tmdb')
  url.searchParams.set('path', 'search/movie')
  url.searchParams.set('query', title)
  if (year) url.searchParams.set('year', String(year))
  const res = await handleTmdb(new Request(url), env, fetchImpl)
  if (!res.ok) return null
  const data = (await res.json()) as {
    results?: { id: number; title: string; release_date?: string; poster_path: string | null; backdrop_path: string | null; genre_ids?: number[]; vote_average?: number }[]
  }
  const m = data.results?.[0]
  if (!m) return null
  return {
    tmdbId: m.id,
    title: m.title,
    releaseYear: Number(m.release_date?.slice(0, 4)) || null,
    posterPath: m.poster_path,
    backdropPath: m.backdrop_path,
    genres: (m.genre_ids ?? []).map((id) => TMDB_GENRES[id]).filter(Boolean),
    voteAverage: m.vote_average ?? 0,
  }
}
