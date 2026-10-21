import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { Db } from './db/index.ts'
import { HttpError, parseCookies, serializeCookie } from './http.ts'

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>

export const SESSION_COOKIE = 'cv_session'
const SESSION_DAYS = 30
const GUEST_SESSION_HOURS = 24
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

export type SessionUser = {
  id: string
  username: string
  displayName: string
  email: string | null
  role: 'member' | 'admin'
  kind: 'member' | 'demo' | 'guest'
  avatarHue: number
  bio: string
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt, 64, SCRYPT)
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string | null) {
  // Always do the work, even with no stored hash, so timing doesn't reveal which accounts exist.
  const [scheme, n, r, p, saltB64, keyB64] = (stored || 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$').split('$')
  if (scheme !== 'scrypt') return false
  const expected = Buffer.from(keyB64 || '', 'base64')
  const key = await scrypt(password, Buffer.from(saltB64, 'base64'), 64, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  })
  return Boolean(stored) && expected.length === key.length && timingSafeEqual(expected, key)
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** Creates a session row and returns the Set-Cookie header. Only the token's hash is stored. */
export async function createSession(db: Db, userId: string, req: Request, opts: { guest?: boolean } = {}) {
  const token = randomBytes(32).toString('base64url')
  const ttlSeconds = opts.guest ? GUEST_SESSION_HOURS * 3600 : SESSION_DAYS * 86400
  await db.query(
    `insert into sessions (token_hash, user_id, expires_at) values ($1, $2, now() + make_interval(secs => $3))`,
    [sha256(token), userId, ttlSeconds],
  )
  return serializeCookie(SESSION_COOKIE, token, { maxAge: ttlSeconds, secure: isSecure(req) })
}

export function clearSessionCookie(req: Request) {
  return serializeCookie(SESSION_COOKIE, '', { maxAge: 0, secure: isSecure(req) })
}

export async function destroySession(db: Db, req: Request) {
  const token = parseCookies(req.headers.get('cookie'))[SESSION_COOKIE]
  if (token) await db.query('delete from sessions where token_hash = $1', [sha256(token)])
}

export async function getSessionUser(db: Db, req: Request): Promise<SessionUser | null> {
  const token = parseCookies(req.headers.get('cookie'))[SESSION_COOKIE]
  if (!token || token.length > 100) return null
  const rows = await db.query<SessionUser>(
    `select u.id, u.username, u.display_name as "displayName", u.email, u.role, u.kind,
            u.avatar_hue as "avatarHue", u.bio
       from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [sha256(token)],
  )
  return rows[0] ?? null
}

function isSecure(req: Request) {
  const proto = req.headers.get('x-forwarded-proto')
  return proto ? proto === 'https' : new URL(req.url).protocol === 'https:'
}

/**
 * Same-origin check for state-changing requests. Browsers always send Origin on
 * cross-site POST/PUT/PATCH/DELETE, so a mismatch means another site is driving the request.
 */
export function assertSameOrigin(req: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return
  const origin = req.headers.get('origin')
  if (!origin) return
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host
  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    throw new HttpError(403, 'bad_origin', 'Cross-site request blocked.')
  }
  if (originHost !== host) throw new HttpError(403, 'bad_origin', 'Cross-site request blocked.')
}

/** Fixed-window limiter, per process. Enough to blunt password guessing on a demo app. */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return (key: string, now = Date.now()) => {
    const hit = hits.get(key)
    if (!hit || hit.resetAt <= now) {
      if (hits.size > 5000) hits.clear()
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return
    }
    hit.count += 1
    if (hit.count > limit) {
      const retry = Math.ceil((hit.resetAt - now) / 1000)
      throw new HttpError(429, 'rate_limited', `Too many attempts. Try again in ${retry}s.`)
    }
  }
}

export function hueFor(username: string) {
  let h = 0
  for (const ch of username) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}
