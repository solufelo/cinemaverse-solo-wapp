import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The client asks /api/health whether TMDB is configured before calling the proxy, so a server
// without a key never produces a failing request (and a console error) on every page.
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

async function freshTmdb(fetchImpl) {
  vi.resetModules()
  vi.stubGlobal('fetch', vi.fn(fetchImpl))
  return import('../../src/lib/tmdb.js')
}

beforeEach(() => vi.unstubAllGlobals())
afterEach(() => vi.unstubAllGlobals())

describe('client TMDB access', () => {
  it('uses the offline catalog without calling the proxy when the server has no TMDB key', async () => {
    const { getTrending } = await freshTmdb(async (url) => (String(url) === '/api/health' ? json({ ok: true, tmdb: false }) : json({}, 503)))
    const res = await getTrending()
    expect(res.source).toBe('catalog')
    expect(res.films.length).toBeGreaterThan(10)
    const urls = fetch.mock.calls.map(([u]) => String(u))
    expect(urls).toEqual(['/api/health'])
  })

  it('asks for health once and reuses it', async () => {
    const { getTrending, searchFilms } = await freshTmdb(async () => json({ ok: true, tmdb: false }))
    await getTrending()
    await searchFilms('dune')
    expect(fetch.mock.calls.filter(([u]) => String(u) === '/api/health')).toHaveLength(1)
  })

  it('goes through the proxy when TMDB is configured', async () => {
    const { getTrending } = await freshTmdb(async (url) =>
      String(url) === '/api/health'
        ? json({ ok: true, tmdb: true })
        : json({ results: [{ id: 1, title: 'Test Film', release_date: '2024-05-01', poster_path: '/p.jpg', backdrop_path: '/b.jpg', genre_ids: [878], vote_average: 7.1 }] }),
    )
    const res = await getTrending()
    expect(res.source).toBe('tmdb')
    expect(res.films[0]).toMatchObject({ tmdbId: 1, title: 'Test Film', releaseYear: 2024, genres: ['Science Fiction'] })
  })

  it('still tries the proxy if the health check itself fails', async () => {
    const { searchFilms } = await freshTmdb(async (url) =>
      String(url) === '/api/health' ? json({ error: { message: 'down' } }, 500) : json({ results: [{ id: 2, title: 'Found', genre_ids: [] }] }),
    )
    const res = await searchFilms('found')
    expect(res).toMatchObject({ source: 'tmdb', films: [{ tmdbId: 2, title: 'Found' }] })
  })
})
