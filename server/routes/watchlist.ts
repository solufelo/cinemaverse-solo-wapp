import type { Db } from '../db/index.ts'
import { HttpError, json, readJson, validate } from '../http.ts'
import { ENTRY_COLUMNS, listEntries, type WatchEntry } from '../queries.ts'
import type { Router } from '../router.ts'
import { logSchema, patchEntrySchema, tmdbIdParam, watchlistQuerySchema } from '../validation.ts'

/**
 * Watchlist = one row per (user, film) holding the current status.
 * Every meaningful change also appends an `activity` row, which is what the social feed shows.
 * All queries are scoped by the session user's id, so nobody can touch another player's list.
 */
export function registerWatchlist(router: Router) {
  router.on('GET', '/api/watchlist', 'user', async ({ db, user, url }) => {
    const q = validate(watchlistQuerySchema, Object.fromEntries(url.searchParams))
    const entries = await listEntries(db, user.id, q.status)
    const counts = await db.query<{ status: string; n: number }>(
      'select status, count(*)::int as n from watch_entries where user_id = $1 group by status',
      [user.id],
    )
    return json({ entries, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) })
  })

  // Log a film (create or update). Idempotent per film.
  router.on('PUT', '/api/watchlist/:tmdbId', 'user', async ({ req, db, user, params }) => {
    const tmdbId = validate(tmdbIdParam, params.tmdbId)
    const body = await readJson(req, logSchema)
    const result = await db.transaction(async (tx) => {
      const [before] = await tx.query<WatchEntry>(
        `select ${ENTRY_COLUMNS} from watch_entries where user_id = $1 and tmdb_id = $2 for update`,
        [user.id, tmdbId],
      )
      const next = {
        status: body.status,
        rating: body.rating === undefined ? (before?.rating ?? null) : body.rating,
        note: body.note === undefined ? (before?.note ?? '') : body.note,
      }
      const [entry] = await tx.query<WatchEntry>(
        `insert into watch_entries (user_id, tmdb_id, title, poster_path, backdrop_path, release_year, genres, status, rating, note)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (user_id, tmdb_id) do update set
           title = excluded.title, poster_path = excluded.poster_path,
           backdrop_path = coalesce(excluded.backdrop_path, watch_entries.backdrop_path),
           release_year = excluded.release_year,
           genres = case when cardinality(excluded.genres) > 0 then excluded.genres else watch_entries.genres end,
           status = excluded.status, rating = excluded.rating, note = excluded.note, updated_at = now()
         returning ${ENTRY_COLUMNS}`,
        [
          user.id,
          tmdbId,
          body.film.title,
          body.film.posterPath ?? null,
          body.film.backdropPath ?? null,
          body.film.releaseYear ?? null,
          body.film.genres,
          next.status,
          next.rating,
          next.note,
        ],
      )
      const activity = await recordActivity(tx, user.id, before, entry, body.note)
      return { entry, activityId: activity, created: !before }
    })
    return json(result, { status: result.created ? 201 : 200 })
  })

  router.on('PATCH', '/api/watchlist/:tmdbId', 'user', async ({ req, db, user, params }) => {
    const tmdbId = validate(tmdbIdParam, params.tmdbId)
    const body = await readJson(req, patchEntrySchema)
    const result = await db.transaction(async (tx) => {
      const [before] = await tx.query<WatchEntry>(
        `select ${ENTRY_COLUMNS} from watch_entries where user_id = $1 and tmdb_id = $2 for update`,
        [user.id, tmdbId],
      )
      if (!before) throw new HttpError(404, 'not_found', 'That film is not on your list.')
      const [entry] = await tx.query<WatchEntry>(
        `update watch_entries set status = $3, rating = $4, note = $5, updated_at = now()
          where user_id = $1 and tmdb_id = $2 returning ${ENTRY_COLUMNS}`,
        [
          user.id,
          tmdbId,
          body.status ?? before.status,
          body.rating === undefined ? before.rating : body.rating,
          body.note ?? before.note,
        ],
      )
      const activityId = await recordActivity(tx, user.id, before, entry, body.note)
      return { entry, activityId }
    })
    return json(result)
  })

  router.on('DELETE', '/api/watchlist/:tmdbId', 'user', async ({ db, user, params }) => {
    const tmdbId = validate(tmdbIdParam, params.tmdbId)
    const rows = await db.query('delete from watch_entries where user_id = $1 and tmdb_id = $2 returning tmdb_id', [
      user.id,
      tmdbId,
    ])
    if (!rows.length) throw new HttpError(404, 'not_found', 'That film is not on your list.')
    return json({ ok: true })
  })
}

/**
 * Append to the feed when something worth sharing happened: a new log, a status change,
 * a new rating, or a fresh written take. Silent edits (same values) post nothing.
 */
async function recordActivity(
  tx: Db,
  userId: string,
  before: WatchEntry | undefined,
  after: WatchEntry,
  noteInput: string | undefined,
) {
  const changed =
    !before ||
    before.status !== after.status ||
    (after.rating !== null && before.rating !== after.rating) ||
    (Boolean(noteInput) && noteInput !== before.note)
  if (!changed) return null
  const [row] = await tx.query<{ id: string }>(
    `insert into activity (user_id, tmdb_id, title, poster_path, release_year, status, rating, note)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
    [
      userId,
      after.tmdbId,
      after.title,
      after.posterPath,
      after.releaseYear,
      after.status,
      after.rating,
      // Only carry the note when it was written in this request, so old takes aren't re-posted.
      noteInput ?? '',
    ],
  )
  return row.id
}
