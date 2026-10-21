import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '../../server/db/index.ts'
import { FILM, makeClient, makeDb, resetUserData } from './helpers.ts'

let db: Db
beforeAll(async () => {
  db = await makeDb()
})
afterAll(() => db.close())
beforeEach(() => resetUserData(db))

describe('watchlist API', () => {
  it('requires a session on every watchlist route', async () => {
    const { call } = makeClient(db)
    expect((await call('GET', '/api/watchlist')).status).toBe(401)
    expect((await call('PUT', '/api/watchlist/329865', { body: { film: FILM, status: 'planned' } })).status).toBe(401)
    expect((await call('PATCH', '/api/watchlist/329865', { body: { rating: 8 } })).status).toBe(401)
    expect((await call('DELETE', '/api/watchlist/329865')).status).toBe(401)
  })

  it('logs a film, then posts it to the public feed', async () => {
    const { call, signup } = makeClient(db)
    const cookie = await signup('logger')
    const res = await call('PUT', '/api/watchlist/329865', {
      cookie,
      body: { film: FILM, status: 'completed', rating: 9, note: '  Heptapods forever.  ' },
    })
    expect(res.status).toBe(201)
    expect(res.body.entry).toMatchObject({ tmdbId: 329865, status: 'completed', rating: 9, note: 'Heptapods forever.', genres: FILM.genres })
    expect(res.body.activityId).toEqual(expect.any(String))

    const feed = await call('GET', '/api/feed?limit=1')
    expect(feed.body.items[0]).toMatchObject({
      id: res.body.activityId,
      status: 'completed',
      rating: 9,
      note: 'Heptapods forever.',
      film: { tmdbId: 329865, title: 'Arrival' },
      user: { username: 'logger' },
    })

    const list = await call('GET', '/api/watchlist', { cookie })
    expect(list.body.entries).toHaveLength(1)
    expect(list.body.counts).toEqual({ completed: 1 })
  })

  it('only posts to the feed when something changed', async () => {
    const { call, signup } = makeClient(db)
    const cookie = await signup('steady')
    await call('PUT', '/api/watchlist/329865', { cookie, body: { film: FILM, status: 'watching' } })
    const same = await call('PUT', '/api/watchlist/329865', { cookie, body: { film: FILM, status: 'watching' } })
    expect(same.status).toBe(200)
    expect(same.body.activityId).toBeNull()
    const moved = await call('PATCH', '/api/watchlist/329865', { cookie, body: { status: 'completed', rating: 8 } })
    expect(moved.body.activityId).toEqual(expect.any(String))
    expect(moved.body.entry).toMatchObject({ status: 'completed', rating: 8 })
    const [{ n }] = await db.query<{ n: number }>(
      "select count(*)::int as n from activity a join users u on u.id = a.user_id where u.username = 'steady'",
    )
    expect(n).toBe(2)
  })

  it('validates the film payload, rating, note length and id', async () => {
    const { call, signup } = makeClient(db)
    const cookie = await signup('validator')
    const cases: [string, unknown][] = [
      ['/api/watchlist/329865', { film: { ...FILM, posterPath: 'https://evil.example/x.jpg' }, status: 'planned' }],
      ['/api/watchlist/329865', { film: FILM, status: 'binged' }],
      ['/api/watchlist/329865', { film: FILM, status: 'completed', rating: 11 }],
      ['/api/watchlist/329865', { film: FILM, status: 'completed', note: 'x'.repeat(281) }],
      ['/api/watchlist/329865', { film: { ...FILM, title: '' }, status: 'planned' }],
      ['/api/watchlist/-4', { film: FILM, status: 'planned' }],
      ['/api/watchlist/abc', { film: FILM, status: 'planned' }],
    ]
    for (const [path, body] of cases) {
      const res = await call('PUT', path, { cookie, body })
      expect(res.status, JSON.stringify(body).slice(0, 80)).toBe(400)
    }
  })

  it("keeps players out of each other's lists", async () => {
    const { call, signup } = makeClient(db)
    const alice = await signup('alice')
    const bob = await signup('bob')
    await call('PUT', '/api/watchlist/329865', { cookie: alice, body: { film: FILM, status: 'completed', rating: 10 } })

    expect((await call('PATCH', '/api/watchlist/329865', { cookie: bob, body: { rating: 1 } })).status).toBe(404)
    expect((await call('DELETE', '/api/watchlist/329865', { cookie: bob })).status).toBe(404)
    expect((await call('GET', '/api/watchlist', { cookie: bob })).body.entries).toEqual([])

    const aliceList = await call('GET', '/api/watchlist', { cookie: alice })
    expect(aliceList.body.entries[0]).toMatchObject({ rating: 10, status: 'completed' })
  })

  it('filters by status, clears a rating, and removes entries', async () => {
    const { call, signup } = makeClient(db)
    const cookie = await signup('curator')
    await call('PUT', '/api/watchlist/329865', { cookie, body: { film: FILM, status: 'completed', rating: 7 } })
    await call('PUT', '/api/watchlist/62', { cookie, body: { film: { ...FILM, title: '2001: A Space Odyssey' }, status: 'planned' } })
    const planned = await call('GET', '/api/watchlist?status=planned', { cookie })
    expect(planned.body.entries.map((e: { tmdbId: number }) => e.tmdbId)).toEqual([62])
    expect((await call('GET', '/api/watchlist?status=nope', { cookie })).status).toBe(400)

    const cleared = await call('PATCH', '/api/watchlist/329865', { cookie, body: { rating: null } })
    expect(cleared.body.entry.rating).toBeNull()

    expect((await call('DELETE', '/api/watchlist/62', { cookie })).status).toBe(200)
    expect((await call('DELETE', '/api/watchlist/62', { cookie })).status).toBe(404)
    expect((await call('PATCH', '/api/watchlist/62', { cookie, body: {} })).status).toBe(400)
  })
})
