import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../../server/auth.ts'
import type { Db } from '../../server/db/index.ts'
import { makeClient, makeDb, resetUserData } from './helpers.ts'

let db: Db
beforeAll(async () => {
  db = await makeDb()
})
afterAll(() => db.close())
beforeEach(() => resetUserData(db))

describe('passwords', () => {
  it('hashes with scrypt and verifies only the right password', async () => {
    const hash = await hashPassword('hunter2-but-longer')
    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$/)
    expect(await verifyPassword('hunter2-but-longer', hash)).toBe(true)
    expect(await verifyPassword('wrong', hash)).toBe(false)
    expect(await verifyPassword('anything', null)).toBe(false)
  })
})

describe('auth API', () => {
  it('signs up, sets an HttpOnly session cookie and returns the user from /me without secrets', async () => {
    const { call } = makeClient(db)
    const res = await call('POST', '/api/auth/signup', {
      body: { username: 'Solo_Test', email: 'Solo@Example.test', password: 'long enough pw', displayName: 'Solo' },
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('set-cookie')).toMatch(/cv_session=.+; Path=\/; HttpOnly; SameSite=Lax/)
    const me = await call('GET', '/api/auth/me', { cookie: res.cookie })
    expect(me.body.user).toMatchObject({ username: 'solo_test', email: 'solo@example.test', displayName: 'Solo', role: 'member', kind: 'member' })
    expect(JSON.stringify(me.body)).not.toMatch(/password|scrypt/i)
  })

  it('rejects invalid input with field-level messages', async () => {
    const { call } = makeClient(db)
    const res = await call('POST', '/api/auth/signup', { body: { username: 'x', email: 'nope', password: 'short' } })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('validation_failed')
    expect(Object.keys(res.body.error.details.fields)).toEqual(expect.arrayContaining(['username', 'email', 'password']))
  })

  it('blocks reserved and guest-prefixed usernames', async () => {
    const { call } = makeClient(db)
    for (const username of ['admin', 'guest_abc123']) {
      const res = await call('POST', '/api/auth/signup', { body: { username, email: `${username}@x.test`, password: 'long enough pw' } })
      expect(res.status).toBe(400)
    }
  })

  it('refuses duplicate usernames (including seeded demo players) and emails', async () => {
    const { call, signup } = makeClient(db)
    await signup('taken_name', { email: 'taken@x.test' })
    const dupeUser = await call('POST', '/api/auth/signup', { body: { username: 'nova', email: 'n@x.test', password: 'long enough pw' } })
    expect(dupeUser.status).toBe(409)
    expect(dupeUser.body.error.code).toBe('username_taken')
    const dupeEmail = await call('POST', '/api/auth/signup', { body: { username: 'fresh_one', email: 'TAKEN@x.test', password: 'long enough pw' } })
    expect(dupeEmail.status).toBe(409)
    expect(dupeEmail.body.error.code).toBe('email_taken')
  })

  it('logs in by email or username, rejects bad passwords, and never lets anyone into demo players', async () => {
    const { call, signup } = makeClient(db)
    await signup('logger', { email: 'logger@x.test', password: 'the right password' })
    expect((await call('POST', '/api/auth/login', { body: { identifier: 'logger@x.test', password: 'the right password' } })).status).toBe(200)
    expect((await call('POST', '/api/auth/login', { body: { identifier: 'LOGGER', password: 'the right password' } })).status).toBe(200)
    const bad = await call('POST', '/api/auth/login', { body: { identifier: 'logger', password: 'wrong password' } })
    expect(bad.status).toBe(401)
    expect(bad.cookie).toBeUndefined()
    expect((await call('POST', '/api/auth/login', { body: { identifier: 'nova', password: '' } })).status).toBe(400)
    expect((await call('POST', '/api/auth/login', { body: { identifier: 'nova', password: 'anything' } })).status).toBe(401)
  })

  it('logout deletes the session server-side', async () => {
    const { call, signup } = makeClient(db)
    const cookie = await signup('leaver')
    const out = await call('POST', '/api/auth/logout', { cookie, body: {} })
    expect(out.headers.get('set-cookie')).toMatch(/Max-Age=0/)
    expect((await call('GET', '/api/auth/me', { cookie })).body.user).toBeNull()
  })

  it('creates a guest account in one click', async () => {
    const { call } = makeClient(db)
    const res = await call('POST', '/api/auth/demo', { body: {} })
    expect(res.status).toBe(201)
    expect(res.body.username).toMatch(/^guest_[0-9a-f]{6}$/)
    const me = await call('GET', '/api/auth/me', { cookie: res.cookie })
    expect(me.body.user).toMatchObject({ kind: 'guest', email: null })
  })

  it('grants admin only to emails listed in ADMIN_EMAILS', async () => {
    const { call, signup } = makeClient(db, { ADMIN_EMAILS: 'boss@x.test, other@x.test' })
    const boss = await signup('boss', { email: 'Boss@x.test' })
    const pleb = await signup('pleb', { email: 'pleb@x.test' })
    expect((await call('GET', '/api/auth/me', { cookie: boss })).body.user.role).toBe('admin')
    expect((await call('GET', '/api/auth/me', { cookie: pleb })).body.user.role).toBe('member')
  })

  it('rejects non-JSON bodies and cross-site origins (CSRF guards)', async () => {
    const { call } = makeClient(db)
    const form = await call('POST', '/api/auth/login', {
      rawBody: 'identifier=a&password=b',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    })
    expect(form.status).toBe(415)
    const cross = await call('POST', '/api/auth/demo', { body: {}, headers: { origin: 'https://evil.example' } })
    expect(cross.status).toBe(403)
    const same = await call('POST', '/api/auth/demo', { body: {}, headers: { origin: 'http://cinemaverse.test' } })
    expect(same.status).toBe(201)
  })

  it('ignores forged or expired session cookies', async () => {
    const { call } = makeClient(db)
    expect((await call('GET', '/api/auth/me', { cookie: 'cv_session=forged' })).body.user).toBeNull()
    const cookie = (await call('POST', '/api/auth/demo', { body: {} })).cookie
    await db.query("update sessions set expires_at = now() - interval '1 minute'")
    expect((await call('GET', '/api/auth/me', { cookie })).body.user).toBeNull()
  })

  it('returns 404 / 405 for unknown routes and methods', async () => {
    const { call } = makeClient(db)
    expect((await call('GET', '/api/nope')).status).toBe(404)
    expect((await call('DELETE', '/api/auth/me')).status).toBe(405)
  })
})
