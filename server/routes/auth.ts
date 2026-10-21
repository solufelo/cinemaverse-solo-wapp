import { randomBytes } from 'node:crypto'
import {
  clearSessionCookie,
  createRateLimiter,
  createSession,
  destroySession,
  hashPassword,
  hueFor,
  verifyPassword,
} from '../auth.ts'
import { HttpError, json, readJson } from '../http.ts'
import type { Router } from '../router.ts'
import { loginSchema, signupSchema } from '../validation.ts'

const authLimiter = createRateLimiter(20, 10 * 60_000)
const guestLimiter = createRateLimiter(10, 60 * 60_000)

export function registerAuth(router: Router) {
  router.on('GET', '/api/auth/me', 'public', async ({ user }) => json({ user }))

  router.on('POST', '/api/auth/signup', 'public', async ({ req, db, env, clientIp }) => {
    authLimiter(`signup:${clientIp}`)
    const body = await readJson(req, signupSchema)
    const admins = (env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    const role = admins.includes(body.email) ? 'admin' : 'member'
    const passwordHash = await hashPassword(body.password)
    const taken = await db.query<{ username: string; email: string }>(
      'select username, email from users where username = $1 or email = $2',
      [body.username, body.email],
    )
    if (taken.some((t) => t.username === body.username)) {
      throw new HttpError(409, 'username_taken', 'That username is taken.', { fields: { username: 'Taken.' } })
    }
    if (taken.length) {
      throw new HttpError(409, 'email_taken', 'An account with that email already exists. Sign in instead.', {
        fields: { email: 'Already registered.' },
      })
    }
    const [user] = await db.query<{ id: string }>(
      `insert into users (username, display_name, email, password_hash, avatar_hue, role)
       values ($1, $2, $3, $4, $5, $6) returning id`,
      [body.username, body.displayName || body.username, body.email, passwordHash, hueFor(body.username), role],
    )
    const cookie = await createSession(db, user.id, req)
    return json({ ok: true, username: body.username }, { status: 201, headers: { 'set-cookie': cookie } })
  })

  router.on('POST', '/api/auth/login', 'public', async ({ req, db, clientIp }) => {
    const body = await readJson(req, loginSchema)
    authLimiter(`login:${clientIp}`)
    authLimiter(`login-id:${body.identifier}`)
    const [row] = await db.query<{ id: string; passwordHash: string | null }>(
      `select id, password_hash as "passwordHash" from users
        where (email = $1 or username = $1) and kind = 'member'`,
      [body.identifier],
    )
    const ok = await verifyPassword(body.password, row?.passwordHash ?? null)
    if (!row || !ok) throw new HttpError(401, 'bad_credentials', 'Email/username or password is wrong.')
    const cookie = await createSession(db, row.id, req)
    return json({ ok: true }, { headers: { 'set-cookie': cookie } })
  })

  /** One-click guest account: no email, no password, expires after 24 hours. */
  router.on('POST', '/api/auth/demo', 'public', async ({ req, db, clientIp }) => {
    guestLimiter(`guest:${clientIp}`)
    // Housekeeping: expired guests (and, by cascade, their logs and sessions) go away.
    await db.query("delete from users where kind = 'guest' and created_at < now() - interval '24 hours'")
    const suffix = randomBytes(3).toString('hex')
    const username = `guest_${suffix}`
    const [user] = await db.query<{ id: string }>(
      `insert into users (username, display_name, avatar_hue, kind) values ($1, $2, $3, 'guest') returning id`,
      [username, `Guest ${suffix.toUpperCase()}`, hueFor(username)],
    )
    const cookie = await createSession(db, user.id, req, { guest: true })
    return json({ ok: true, username }, { status: 201, headers: { 'set-cookie': cookie } })
  })

  router.on('POST', '/api/auth/logout', 'public', async ({ req, db }) => {
    await destroySession(db, req)
    return json({ ok: true }, { headers: { 'set-cookie': clearSessionCookie(req) } })
  })
}
