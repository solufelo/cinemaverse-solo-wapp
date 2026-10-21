import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '../../server/db/index.ts'
import { FILM, makeClient, makeDb, resetUserData } from './helpers.ts'

let db: Db
beforeAll(async () => {
  db = await makeDb()
})
afterAll(() => db.close())
beforeEach(() => resetUserData(db))

describe('public profiles', () => {
  it('shows stats, shelves and recent activity for a demo player', async () => {
    const { call } = makeClient(db)
    const res = await call('GET', '/api/users/NOVA')
    expect(res.status).toBe(200)
    expect(res.body.profile).toMatchObject({ username: 'nova', displayName: 'Nova', kind: 'demo', isMe: false })
    expect(res.body.stats).toMatchObject({ logged: 7, completed: 5, watching: 1, planned: 1, dropped: 0, rated: 5, avgRating: 7.8 })
    expect(res.body.stats.topGenres[0]).toEqual({ name: 'Science Fiction', count: 7 })
    expect(res.body.entries).toHaveLength(7)
    expect(res.body.activity.length).toBeGreaterThan(0)
    expect(res.body.spotlight).toMatchObject({ title: 'Dune: Part Two' })
  })

  it('never exposes email, role or internal ids', async () => {
    const { call, signup } = makeClient(db)
    await signup('private_person', { email: 'secret@x.test' })
    const res = await call('GET', '/api/users/private_person')
    const raw = JSON.stringify(res.body)
    expect(raw).not.toContain('secret@x.test')
    expect(res.body.profile).not.toHaveProperty('id')
    expect(res.body.profile).not.toHaveProperty('role')
    expect(res.body.profile).not.toHaveProperty('email')
  })

  it('404s for unknown players and 400s for malformed handles', async () => {
    const { call } = makeClient(db)
    expect((await call('GET', '/api/users/nobody_here')).status).toBe(404)
    expect((await call('GET', '/api/users/%3Cscript%3E')).status).toBe(400)
  })

  it('lets a player edit their own display name and bio only', async () => {
    const { call, signup } = makeClient(db)
    expect((await call('PATCH', '/api/users/me', { body: { bio: 'hi' } })).status).toBe(401)
    const cookie = await signup('editor')
    const res = await call('PATCH', '/api/users/me', { cookie, body: { displayName: 'The Editor', bio: 'Cuts for time.' } })
    expect(res.body.profile).toEqual({ displayName: 'The Editor', bio: 'Cuts for time.' })
    expect((await call('PATCH', '/api/users/me', { cookie, body: { bio: 'x'.repeat(161) } })).status).toBe(400)
    const view = await call('GET', '/api/users/editor', { cookie })
    expect(view.body.profile).toMatchObject({ displayName: 'The Editor', isMe: true })
  })

  it('reflects new logs in the stats', async () => {
    const { call, signup } = makeClient(db)
    const cookie = await signup('newbie')
    await call('PUT', '/api/watchlist/329865', { cookie, body: { film: FILM, status: 'completed', rating: 8 } })
    const res = await call('GET', '/api/users/newbie')
    expect(res.body.stats).toMatchObject({ logged: 1, completed: 1, avgRating: 8 })
    expect(res.body.activity[0].film.title).toBe('Arrival')
  })
})

describe('health', () => {
  it('reports the embedded database and missing keys honestly', async () => {
    const { call } = makeClient(db)
    const res = await call('GET', '/api/health')
    expect(res.body).toEqual({ ok: true, database: 'pglite-memory', sandbox: true, ai: false, tmdb: false })
  })
})
