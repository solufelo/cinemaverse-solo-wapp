import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import pg from 'pg'
import { migrate } from './migrate.ts'
import { seedDemo } from './seed.ts'

/**
 * One tiny interface over two PostgreSQL drivers:
 *  - `pg` when DATABASE_URL points at a real server (Neon, Supabase, RDS, local Postgres)
 *  - PGlite (Postgres 18 compiled to WASM) for local dev, tests and the no-database sandbox.
 * The SQL is identical for both, so tests exercise the same queries production runs.
 */
export type DbKind = 'postgres' | 'pglite-file' | 'pglite-memory'

export interface Db {
  kind: DbKind
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>
  close(): Promise<void>
}

type Queryable = { query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }> }

function wrap(kind: DbKind, q: Queryable, tx: Db['transaction'], close: Db['close']): Db {
  return {
    kind,
    async query<T>(sql: string, params: unknown[] = []) {
      const res = await q.query(sql, params)
      return res.rows as T[]
    },
    transaction: tx,
    close,
  }
}

export function pgliteDb(dataDir?: string): Db {
  if (dataDir) mkdirSync(dirname(dataDir), { recursive: true })
  const lite = new PGlite(dataDir)
  const kind: DbKind = dataDir ? 'pglite-file' : 'pglite-memory'
  const db: Db = wrap(
    kind,
    lite,
    (fn) =>
      lite.transaction(async (t) => {
        const inner = wrap(kind, t, (f) => f(inner), async () => {})
        return fn(inner)
      }),
    () => lite.close(),
  )
  return db
}

export function postgresDb(connectionString: string): Db {
  const pool = new pg.Pool({ connectionString, max: Number(process.env.PG_POOL_MAX || 3) })
  return wrap(
    'postgres',
    pool,
    async (fn) => {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const inner = wrap('postgres', client, (f) => f(inner), async () => {})
        const result = await fn(inner)
        await client.query('COMMIT')
        return result
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {})
        throw err
      } finally {
        client.release()
      }
    },
    () => pool.end(),
  )
}

export function createDbFromEnv(env: NodeJS.ProcessEnv = process.env): Db {
  const url = env.DATABASE_URL?.trim()
  if (url && /^postgres(ql)?:\/\//.test(url)) return postgresDb(url)
  if (url === 'memory://') return pgliteDb()
  // CINEMAVERSE_DEV is set by the Vite dev middleware: persist the embedded DB between restarts.
  const dir = env.PGLITE_DIR || (env.CINEMAVERSE_DEV ? '.data/pglite' : undefined)
  return pgliteDb(dir)
}

/** Migrate (and seed demo data when enabled) once per process. */
export async function prepareDb(db: Db, env: NodeJS.ProcessEnv = process.env) {
  await migrate(db)
  if (env.SEED_DEMO !== 'false') await seedDemo(db)
  return db
}

// Survives Vite HMR re-imports and warm serverless invocations.
const g = globalThis as typeof globalThis & { __cinemaverseDb?: Promise<Db> }

export function getDb(): Promise<Db> {
  if (!g.__cinemaverseDb) {
    g.__cinemaverseDb = prepareDb(createDbFromEnv()).catch((err) => {
      g.__cinemaverseDb = undefined
      throw err
    })
  }
  return g.__cinemaverseDb
}
