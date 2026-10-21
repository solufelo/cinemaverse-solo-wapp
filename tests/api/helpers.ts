import { createApp } from '../../server/app.ts'
import { pgliteDb, type Db } from '../../server/db/index.ts'
import { migrate } from '../../server/db/migrate.ts'
import { seedDemo } from '../../server/db/seed.ts'
import type { Env } from '../../server/router.ts'

const ORIGIN = 'http://cinemaverse.test'

/** Fresh in-memory Postgres (PGlite) with schema + demo seed. One per test file. */
export async function makeDb({ seed = true } = {}) {
  const db = pgliteDb()
  await migrate(db)
  if (seed) await seedDemo(db, new Date('2026-10-20T12:00:00Z'))
  return db
}

export async function resetUserData(db: Db) {
  await db.query("delete from users where kind <> 'demo'")
}

export type CallOpts = { body?: unknown; cookie?: string; headers?: Record<string, string>; rawBody?: string }

export function makeClient(db: Db, env: Env = {}, fetchImpl?: typeof fetch) {
  const app = createApp({ db, env, fetch: fetchImpl })
  let clientIp = 0
  async function call(method: string, path: string, opts: CallOpts = {}) {
    const headers: Record<string, string> = { ...opts.headers }
    if (opts.cookie) headers.cookie = opts.cookie
    let body: string | undefined
    if (opts.rawBody !== undefined) body = opts.rawBody
    else if (opts.body !== undefined) {
      body = JSON.stringify(opts.body)
      headers['content-type'] ??= 'application/json'
    }
    // Each call gets its own IP so the auth rate limiter never trips across tests.
    const res = await app(new Request(ORIGIN + path, { method, headers, body }), { clientIp: `10.0.0.${++clientIp % 250}` })
    const text = await res.text()
    const setCookie = res.headers.get('set-cookie')
    return {
      status: res.status,
      body: text ? JSON.parse(text) : null,
      cookie: setCookie ? setCookie.split(';')[0] : undefined,
      headers: res.headers,
    }
  }

  async function signup(username: string, extra: Partial<{ email: string; password: string; displayName: string }> = {}) {
    const res = await call('POST', '/api/auth/signup', {
      body: { username, email: extra.email ?? `${username}@example.test`, password: extra.password ?? 'correct horse battery', ...extra },
    })
    if (res.status !== 201) throw new Error(`signup failed: ${JSON.stringify(res.body)}`)
    return res.cookie as string
  }

  return { call, signup }
}

export const FILM = {
  title: 'Arrival',
  posterPath: '/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg',
  backdropPath: '/8MUZz7oPXQftFTslZpRP3CVMOoq.jpg',
  releaseYear: 2016,
  genres: ['Drama', 'Science Fiction', 'Mystery'],
}
