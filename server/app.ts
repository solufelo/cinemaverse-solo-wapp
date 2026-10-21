import { assertSameOrigin, getSessionUser } from './auth.ts'
import { getDb, type Db } from './db/index.ts'
import { errorResponse, json } from './http.ts'
import { type Env, Router, requireAuth } from './router.ts'
import { registerAuth } from './routes/auth.ts'
import { registerFeed } from './routes/feed.ts'
import { registerUsers } from './routes/users.ts'
import { registerWatchlist } from './routes/watchlist.ts'
import { recommend } from './services/recommend.ts'

export type AppDeps = {
  db: Db | (() => Promise<Db>)
  env?: Env
  fetch?: typeof fetch
}

export function createRouter() {
  const router = new Router()

  router.on('GET', '/api/health', 'public', async ({ db, env }) => {
    await db.query('select 1')
    return json({
      ok: true,
      database: db.kind,
      // In the no-DATABASE_URL sandbox, writes live only as long as the server instance.
      sandbox: db.kind === 'pglite-memory',
      ai: Boolean(env.OPENROUTER_API_KEY),
      tmdb: Boolean(env.TMDB_API_KEY || env.TMDB_UPSTREAM),
    })
  })

  registerAuth(router)
  registerFeed(router)
  registerWatchlist(router)
  registerUsers(router)

  router.on('GET', '/api/recommendations', 'user', async ({ db, user, env, fetch }) =>
    json(await recommend({ db, userId: user.id, env, fetch })),
  )

  return router
}

/** Framework-free request handler: (Request) => Response. Netlify, Vite dev and tests all call this. */
export function createApp(deps: AppDeps) {
  const router = createRouter()
  const env = deps.env ?? (process.env as Env)
  const fetchImpl = deps.fetch ?? fetch
  const resolveDb = typeof deps.db === 'function' ? deps.db : async () => deps.db as Db

  return async function handle(req: Request, info: { clientIp?: string } = {}): Promise<Response> {
    try {
      const url = new URL(req.url)
      const { route, params } = router.match(req.method, url.pathname)
      assertSameOrigin(req)
      const db = await resolveDb()
      const user = await getSessionUser(db, req)
      requireAuth(route.access, user)
      return await route.handler({
        req,
        url,
        params,
        db,
        env,
        user,
        clientIp: info.clientIp || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
        fetch: fetchImpl,
      })
    } catch (err) {
      return errorResponse(err)
    }
  }
}

let defaultApp: ReturnType<typeof createApp> | null = null

/** Process-wide app using DATABASE_URL (or embedded Postgres) from the environment. */
export function handler(req: Request, info?: { clientIp?: string }) {
  defaultApp ??= createApp({ db: getDb })
  return defaultApp(req, info)
}
