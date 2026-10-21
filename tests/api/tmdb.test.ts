import { describe, expect, it, vi } from 'vitest'
import { buildTmdbQuery, handleTmdb } from '../../server/tmdb.ts'

const req = (qs: string, method = 'GET') => new Request(`http://local/.netlify/functions/tmdb?${qs}`, { method })

describe('TMDB proxy allow-list', () => {
  it('accepts the endpoints the app uses', () => {
    for (const path of ['trending/movie/week', 'search/movie', 'movie/27205', 'movie/27205/recommendations', 'genre/movie/list']) {
      expect(buildTmdbQuery(new URL(`http://x/?path=${path}`))).not.toHaveProperty('error')
    }
  })

  it('rejects other TMDB endpoints, unknown params and oversized values', async () => {
    for (const qs of ['path=account/123', 'path=movie/1/../../account', 'path=search/movie&api_key=steal', `path=search/movie&query=${'a'.repeat(101)}`]) {
      const res = await handleTmdb(req(qs), { TMDB_API_KEY: 'k' }, vi.fn() as unknown as typeof fetch)
      expect(res.status, qs).toBe(400)
    }
    expect((await handleTmdb(req('path=search/movie', 'POST'), { TMDB_API_KEY: 'k' })).status).toBe(405)
  })

  it('says so (503 + fallback flag) when no key is configured', async () => {
    const res = await handleTmdb(req('path=trending/movie/week'), {})
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ fallback: true })
  })

  it('forwards with the server-side key and forces include_adult=false', async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request) => new Response(JSON.stringify({ results: [] })))
    const res = await handleTmdb(req('path=search/movie&query=dune'), { TMDB_API_KEY: 'secret' }, fetchMock as unknown as typeof fetch)
    expect(res.status).toBe(200)
    const called = new URL(String(fetchMock.mock.calls[0][0]))
    expect(called.origin + called.pathname).toBe('https://api.themoviedb.org/3/search/movie')
    expect(called.searchParams.get('api_key')).toBe('secret')
    expect(called.searchParams.get('include_adult')).toBe('false')
    expect(called.searchParams.get('query')).toBe('dune')
  })
})
