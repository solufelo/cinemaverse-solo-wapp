import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '../../server/db/index.ts'
import { DEMO_USERS } from '../../server/db/seed.ts'
import { FILM, makeClient, makeDb, resetUserData } from './helpers.ts'

let db: Db
beforeAll(async () => {
  db = await makeDb()
})
afterAll(() => db.close())
beforeEach(() => resetUserData(db))

type Item = { id: string; createdAt: string; status: string; user: { username: string; kind: string }; likes: number; likedByMe: boolean }

describe('feed API', () => {
  it('is public and pre-populated with demo activity, newest first', async () => {
    const { call } = makeClient(db)
    const res = await call('GET', '/api/feed?limit=50')
    expect(res.status).toBe(200)
    const items: Item[] = res.body.items
    expect(items.length).toBeGreaterThanOrEqual(40)
    expect(items[0].user).toMatchObject({ username: 'nova', kind: 'demo' })
    const times = items.map((i) => Date.parse(i.createdAt))
    expect([...times].sort((a, b) => b - a)).toEqual(times)
    expect(new Set(items.map((i) => i.user.username))).toEqual(new Set(DEMO_USERS.map((u) => u.username)))
  })

  it('pages with a cursor without gaps or duplicates', async () => {
    const { call } = makeClient(db)
    const all: Item[] = (await call('GET', '/api/feed?limit=50')).body.items
    const paged: Item[] = []
    let cursor: string | null = null
    do {
      const qs: string = cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
      const res = await call('GET', `/api/feed?limit=7${qs}`)
      expect(res.status).toBe(200)
      paged.push(...res.body.items)
      cursor = res.body.nextCursor
    } while (cursor)
    const [{ n }] = await db.query<{ n: number }>('select count(*)::int as n from activity')
    expect(paged).toHaveLength(n)
    expect(new Set(paged.map((i) => i.id)).size).toBe(n)
    expect(paged.slice(0, all.length).map((i) => i.id)).toEqual(all.map((i) => i.id))
  })

  it('filters by status and rejects bad query params', async () => {
    const { call } = makeClient(db)
    const done = await call('GET', '/api/feed?status=dropped')
    expect(done.body.items.length).toBeGreaterThan(0)
    expect(done.body.items.every((i: Item) => i.status === 'dropped')).toBe(true)
    expect((await call('GET', '/api/feed?status=binged')).status).toBe(400)
    expect((await call('GET', '/api/feed?limit=500')).status).toBe(400)
    expect((await call('GET', '/api/feed?cursor=not-a-cursor')).status).toBe(400)
  })

  it('lets signed-in players like and unlike, idempotently', async () => {
    const { call, signup } = makeClient(db)
    const [first] = (await call('GET', '/api/feed?limit=1')).body.items as Item[]
    expect((await call('POST', `/api/feed/${first.id}/like`, { body: {} })).status).toBe(401)

    const cookie = await signup('fan')
    const liked = await call('POST', `/api/feed/${first.id}/like`, { cookie, body: {} })
    expect(liked.body).toEqual({ likes: first.likes + 1, likedByMe: true })
    const again = await call('POST', `/api/feed/${first.id}/like`, { cookie, body: {} })
    expect(again.body.likes).toBe(first.likes + 1)
    const view = (await call('GET', '/api/feed?limit=1', { cookie })).body.items[0]
    expect(view.likedByMe).toBe(true)
    const unliked = await call('DELETE', `/api/feed/${first.id}/like`, { cookie })
    expect(unliked.body).toEqual({ likes: first.likes, likedByMe: false })

    expect((await call('POST', '/api/feed/not-a-uuid/like', { cookie, body: {} })).status).toBe(400)
    expect((await call('POST', '/api/feed/00000000-0000-4000-8000-000000000000/like', { cookie, body: {} })).status).toBe(404)
  })

  it('lets owners delete their posts, blocks others, and lets admins moderate', async () => {
    const { call, signup } = makeClient(db, { ADMIN_EMAILS: 'mod@x.test' })
    const owner = await signup('owner')
    const other = await signup('other')
    const mod = await signup('mod', { email: 'mod@x.test' })

    const mine = (await call('PUT', '/api/watchlist/329865', { cookie: owner, body: { film: FILM, status: 'watching' } })).body.activityId
    expect((await call('DELETE', `/api/feed/${mine}`, { cookie: other })).status).toBe(403)
    expect((await call('DELETE', `/api/feed/${mine}`, { cookie: owner })).status).toBe(200)

    const [demoPost] = (await call('GET', '/api/feed?limit=1')).body.items as Item[]
    expect((await call('DELETE', `/api/feed/${demoPost.id}`, { cookie: other })).status).toBe(403)
    expect((await call('DELETE', `/api/feed/${demoPost.id}`, { cookie: mod })).status).toBe(200)
    expect((await call('DELETE', `/api/feed/${demoPost.id}`, { cookie: mod })).status).toBe(404)
  })
})
