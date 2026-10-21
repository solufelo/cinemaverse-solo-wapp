import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { CATALOG } from '../../shared/catalog.ts'
import type { Db } from '../../server/db/index.ts'
import { tasteMatch } from '../../server/services/recommend.ts'
import { FILM, makeClient, makeDb, resetUserData } from './helpers.ts'

let db: Db
beforeAll(async () => {
  db = await makeDb()
})
afterAll(() => db.close())
beforeEach(() => resetUserData(db))

const asCandidates = () => CATALOG.map((f) => ({ ...f, communityAvg: null, communityCount: 0 }))

describe('taste-match engine (no AI key)', () => {
  it('ranks unseen films from loved genres first and explains why', () => {
    const picks = tasteMatch(
      [{ tmdbId: 329865, title: 'Arrival', releaseYear: 2016, genres: ['Drama', 'Science Fiction', 'Mystery'], status: 'completed', rating: 10 }],
      asCandidates(),
      5,
    )
    expect(picks).toHaveLength(5)
    expect(picks.some((p) => p.tmdbId === 329865)).toBe(false)
    expect(picks[0].genres).toContain('Science Fiction')
    expect(picks[0].reason).toMatch(/^Because you rated Arrival 10\/10/)
  })

  it('pushes away genres the player dropped or rated low', () => {
    const picks = tasteMatch(
      [
        { tmdbId: 1, title: 'Bad Horror', releaseYear: 2020, genres: ['Horror'], status: 'dropped', rating: null },
        { tmdbId: 2, title: 'Meh Thriller', releaseYear: 2020, genres: ['Mystery', 'Thriller', 'Horror'], status: 'completed', rating: 2 },
      ],
      asCandidates(),
      6,
    )
    expect(picks.find((p) => p.title === 'Get Out')).toBeUndefined()
  })
})

describe('GET /api/recommendations', () => {
  it('requires a session', async () => {
    const { call } = makeClient(db)
    expect((await call('GET', '/api/recommendations')).status).toBe(401)
  })

  it('falls back to taste-match picks when OPENROUTER_API_KEY is not set', async () => {
    const fetchSpy = vi.fn()
    const { call, signup } = makeClient(db, {}, fetchSpy as unknown as typeof fetch)
    const cookie = await signup('cinephile')
    await call('PUT', '/api/watchlist/329865', { cookie, body: { film: FILM, status: 'completed', rating: 9 } })
    const res = await call('GET', '/api/recommendations', { cookie })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ source: 'taste-match', aiConfigured: false, notice: null, basedOn: 1, model: null })
    expect(res.body.items.length).toBe(8)
    expect(res.body.items.map((i: { tmdbId: number }) => i.tmdbId)).not.toContain(329865)
    // Catalog picks carry a backdrop so the client can lead with a banner.
    expect(res.body.items[0].backdropPath).toMatch(/^\/.+\.jpg$/)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('still works when players logged the same film with different genre lists', async () => {
    // Regression: array_agg over genre arrays of different lengths used to 500 the endpoint.
    const { call, signup } = makeClient(db)
    const a = await signup('genre_short')
    const b = await signup('genre_long')
    const me = await signup('genre_reader')
    await call('PUT', '/api/watchlist/4977', { cookie: a, body: { film: { ...FILM, title: 'Paprika', genres: ['Animation'] }, status: 'completed', rating: 9 } })
    await call('PUT', '/api/watchlist/4977', { cookie: b, body: { film: { ...FILM, title: 'Paprika', genres: ['Animation', 'Science Fiction', 'Thriller'] }, status: 'completed', rating: 8 } })
    const res = await call('GET', '/api/recommendations', { cookie: me })
    expect(res.status).toBe(200)
    expect(res.body.items.length).toBeGreaterThan(0)
  })

  it('gives a cold-start player squad favourites, naming who loved each one', async () => {
    const { call, signup } = makeClient(db)
    const cookie = await signup('blank_slate')
    const res = await call('GET', '/api/recommendations', { cookie })
    expect(res.body.basedOn).toBe(0)
    expect(res.body.items[0].reason).toMatch(/^(Nova|Pixel Rat|Cinema Ghost|Reel Ronin|Kaiju Kid|Velvet Static) gave it \d+\/10/)
  })

  it('writes a different reason for every pick', async () => {
    const { call, signup } = makeClient(db)
    const cookie = await signup('variety')
    // A guest's 10/10 must not surface: guest logs are private to the guest.
    const guest = (await call('POST', '/api/auth/demo', { body: {} })).cookie
    const guestName: string = (await call('GET', '/api/auth/me', { cookie: guest })).body.user.displayName
    await call('PUT', '/api/watchlist/27205', { cookie: guest, body: { film: { ...FILM, title: 'Inception', genres: ['Action', 'Science Fiction', 'Crime'] }, status: 'completed', rating: 10, note: 'guest take' } })
    await call('PUT', '/api/watchlist/438631', { cookie, body: { film: { ...FILM, title: 'Dune', genres: ['Science Fiction', 'Adventure'] }, status: 'completed', rating: 8 } })
    await call('PUT', '/api/watchlist/4977', { cookie, body: { film: { ...FILM, title: 'Paprika', genres: ['Animation', 'Science Fiction', 'Thriller'] }, status: 'planned' } })
    const reasons: string[] = (await call('GET', '/api/recommendations', { cookie })).body.items.map((i: { reason: string }) => i.reason)
    expect(reasons).toHaveLength(8)
    expect(new Set(reasons).size).toBe(reasons.length)
    // Squad members are named, and guests never are.
    expect(reasons.some((r) => / gave it \d+\/10/.test(r))).toBe(true)
    expect(reasons.join(' ')).not.toContain(guestName)
  })

  it('uses OpenRouter when a key is set, mapping picks onto known films', async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe('https://openrouter.ai/api/v1/chat/completions')
      const sent = JSON.parse(String(init?.body))
      expect(sent.model).toBe('test/model')
      expect(sent.messages[1].content).toContain('Arrival (2016): completed, rated 9/10')
      expect((init?.headers as Record<string, string>).authorization).toBe('Bearer sk-or-test')
      const content = JSON.stringify({
        picks: [
          { title: 'Arrival', year: 2016, reason: 'Already logged, must be filtered out.' },
          { title: 'Blade Runner 2049', year: 2017, reason: 'Same director, same patience.' },
          { title: 'Interstellar', year: 2014, reason: 'Big-idea sci-fi with heart.' },
          { title: '2001: A Space Odyssey', year: 1968, reason: 'The ancestor of Arrival.' },
          { title: 'Solaris', year: 1972, reason: 'Slow, strange, rewarding.' },
        ],
      })
      return new Response(JSON.stringify({ choices: [{ message: { content: '```json\n' + content + '\n```' } }] }))
    })
    const { call, signup } = makeClient(db, { OPENROUTER_API_KEY: 'sk-or-test', OPENROUTER_MODEL: 'test/model' }, fetchMock as unknown as typeof fetch)
    const cookie = await signup('ai_user')
    await call('PUT', '/api/watchlist/329865', { cookie, body: { film: FILM, status: 'completed', rating: 9 } })
    const res = await call('GET', '/api/recommendations', { cookie })
    expect(res.body).toMatchObject({ source: 'openrouter', model: 'test/model', aiConfigured: true, notice: null })
    expect(res.body.items.map((i: { title: string }) => i.title)).toEqual(['Blade Runner 2049', 'Interstellar', '2001: A Space Odyssey', 'Solaris'])
    expect(res.body.items[0]).toMatchObject({
      tmdbId: 335984,
      posterPath: expect.stringMatching(/^\/.+\.jpg$/),
      backdropPath: expect.stringMatching(/^\/.+\.jpg$/),
    })
    // Not in the catalog and no TMDB key: still shown, just without a poster, backdrop or id.
    expect(res.body.items[3]).toMatchObject({ tmdbId: null, posterPath: null, backdropPath: null, releaseYear: 1972 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('degrades to taste-match with a notice when OpenRouter fails or returns junk', async () => {
    for (const failing of [
      async () => new Response('upstream down', { status: 502 }),
      async () => new Response(JSON.stringify({ choices: [{ message: { content: 'Sure! Here are some films...' } }] })),
      async () => {
        throw new Error('network')
      },
    ]) {
      const { call, signup } = makeClient(db, { OPENROUTER_API_KEY: 'sk-or-test' }, vi.fn(failing) as unknown as typeof fetch)
      const cookie = await signup(`unlucky_${Math.random().toString(36).slice(2, 8)}`)
      await call('PUT', '/api/watchlist/329865', { cookie, body: { film: FILM, status: 'completed', rating: 9 } })
      const res = await call('GET', '/api/recommendations', { cookie })
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ source: 'taste-match', aiConfigured: true })
      expect(res.body.notice).toMatch(/taste-match picks instead/)
      expect(res.body.items.length).toBeGreaterThan(0)
    }
  })
})
