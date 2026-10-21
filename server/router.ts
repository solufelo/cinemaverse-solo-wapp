import type { SessionUser } from './auth.ts'
import type { Db } from './db/index.ts'
import { HttpError } from './http.ts'

export type Env = {
  OPENROUTER_API_KEY?: string
  OPENROUTER_MODEL?: string
  TMDB_API_KEY?: string
  TMDB_UPSTREAM?: string
  ADMIN_EMAILS?: string
  PUBLIC_SITE_URL?: string
}

export type Ctx = {
  req: Request
  url: URL
  params: Record<string, string>
  db: Db
  env: Env
  user: SessionUser | null
  clientIp: string
  fetch: typeof fetch
}

/** Every route states who may call it; the router enforces it before the handler runs. */
export type Access = 'public' | 'user'

type Route = {
  method: string
  pattern: RegExp
  keys: string[]
  access: Access
  handler: (ctx: Ctx & { user: SessionUser | null }) => Promise<Response>
}

export class Router {
  routes: Route[] = []

  on<A extends Access>(
    method: string,
    path: string,
    access: A,
    handler: (ctx: A extends 'user' ? Ctx & { user: SessionUser } : Ctx) => Promise<Response>,
  ) {
    const keys: string[] = []
    const source = path.replace(/:(\w+)/g, (_, k) => {
      keys.push(k)
      return '([^/]+)'
    })
    this.routes.push({ method, pattern: new RegExp(`^${source}/?$`), keys, access, handler: handler as Route['handler'] })
    return this
  }

  match(method: string, pathname: string) {
    let pathMatched = false
    for (const r of this.routes) {
      const m = r.pattern.exec(pathname)
      if (!m) continue
      pathMatched = true
      if (r.method !== method) continue
      const params: Record<string, string> = {}
      r.keys.forEach((k, i) => {
        try {
          params[k] = decodeURIComponent(m[i + 1])
        } catch {
          throw new HttpError(400, 'bad_path', 'Malformed URL.')
        }
      })
      return { route: r, params }
    }
    if (pathMatched) throw new HttpError(405, 'method_not_allowed', 'Method not allowed on this route.')
    throw new HttpError(404, 'not_found', 'No such API route.')
  }
}

export function requireAuth(access: Access, user: SessionUser | null) {
  if (access === 'user' && !user) throw new HttpError(401, 'unauthenticated', 'Sign in to do that.')
}
