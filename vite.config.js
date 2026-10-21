import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Runs the Netlify Functions in-process during `npm run dev`, so the API, the TMDB proxy
 * and the embedded Postgres all work without netlify-cli or Docker.
 * Production uses the same handlers via netlify/functions/*.mts.
 */
function functionsDevServer() {
  return {
    name: 'cinemaverse-functions-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        const isApi = url === '/api' || url.startsWith('/api/')
        const isTmdb = url.startsWith('/.netlify/functions/tmdb')
        if (!isApi && !isTmdb) return next()
        try {
          const chunks = []
          if (req.method !== 'GET' && req.method !== 'HEAD') for await (const c of req) chunks.push(c)
          const headers = new Headers()
          for (const [k, v] of Object.entries(req.headers)) {
            if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v)
          }
          const request = new Request(`http://${req.headers.host}${url}`, {
            method: req.method,
            headers,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          })
          const response = isApi
            ? await (await server.ssrLoadModule('/server/app.ts')).handler(request, {
                clientIp: req.socket.remoteAddress,
              })
            : await (await server.ssrLoadModule('/server/tmdb.ts')).handleTmdb(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => {
            if (k !== 'set-cookie') res.setHeader(k, v)
          })
          const cookies = response.headers.getSetCookie()
          if (cookies.length) res.setHeader('set-cookie', cookies)
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (err) {
          server.ssrFixStacktrace(err)
          next(err)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Expose server-side settings from .env to the in-process functions (never to the client bundle).
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['DATABASE_URL', 'PGLITE_DIR', 'SEED_DEMO', 'OPENROUTER_API_KEY', 'OPENROUTER_MODEL', 'TMDB_API_KEY', 'TMDB_UPSTREAM', 'ADMIN_EMAILS', 'PUBLIC_SITE_URL']) {
    if (env[key] !== undefined && process.env[key] === undefined) process.env[key] = env[key]
  }
  process.env.CINEMAVERSE_DEV ??= '1'

  return {
    plugins: [react(), functionsDevServer()],
    server: { port: Number(process.env.PORT) || 4410, strictPort: true },
    preview: { port: 4412 },
  }
})
