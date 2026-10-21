import type { Db } from './db/index.ts'
import { HttpError } from './http.ts'
import type { WatchStatus } from '../shared/constants.ts'

export type FeedItem = {
  id: string
  createdAt: string
  status: WatchStatus
  rating: number | null
  note: string
  film: { tmdbId: number; title: string; posterPath: string | null; releaseYear: number | null }
  user: { username: string; displayName: string; avatarHue: number; kind: string }
  likes: number
  likedByMe: boolean
}

type FeedRow = {
  id: string
  createdAt: Date
  cursorTs: string
  status: WatchStatus
  rating: number | null
  note: string
  tmdbId: number
  title: string
  posterPath: string | null
  releaseYear: number | null
  username: string
  displayName: string
  avatarHue: number
  kind: string
  likes: number
  likedByMe: boolean
}

// Keyset cursor. Uses Postgres' own text form of created_at so microseconds survive the round trip.
export function encodeCursor(ts: string, id: string) {
  return Buffer.from(JSON.stringify([ts, id])).toString('base64url')
}

export function decodeCursor(cursor: string): [string, string] {
  try {
    const [ts, id] = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (typeof ts !== 'string' || typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) throw 0
    if (!/^\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d(\.\d{1,6})?([+-]\d\d(:?\d\d)?|Z)?$/.test(ts)) throw 0
    return [ts, id]
  } catch {
    throw new HttpError(400, 'bad_cursor', 'That page link is invalid. Reload the feed.')
  }
}

export async function listFeed(
  db: Db,
  opts: { viewerId: string | null; status?: WatchStatus; userId?: string; limit: number; cursor?: string },
) {
  const [cursorTs, cursorId] = opts.cursor ? decodeCursor(opts.cursor) : [null, null]
  const rows = await db.query<FeedRow>(
    `select a.id, a.created_at as "createdAt", a.created_at::text as "cursorTs", a.status, a.rating, a.note,
            a.tmdb_id as "tmdbId", a.title, a.poster_path as "posterPath", a.release_year as "releaseYear",
            u.username, u.display_name as "displayName", u.avatar_hue as "avatarHue", u.kind,
            (select count(*)::int from activity_likes l where l.activity_id = a.id) as likes,
            exists(select 1 from activity_likes l where l.activity_id = a.id and l.user_id = $1::uuid) as "likedByMe"
       from activity a
       join users u on u.id = a.user_id
      where ($2::text is null or a.status = $2::text)
        and ($3::uuid is null or a.user_id = $3::uuid)
        -- Guest posts reach only the guest's own feed (and their profile), so the shared feed
        -- doesn't fill up with throwaway demo accounts.
        and ($3::uuid is not null or u.kind <> 'guest' or a.user_id = $1::uuid)
        and ($4::timestamptz is null or (a.created_at, a.id) < ($4::timestamptz, $5::uuid))
      order by a.created_at desc, a.id desc
      limit $6`,
    [opts.viewerId, opts.status ?? null, opts.userId ?? null, cursorTs, cursorId, opts.limit + 1],
  )
  const page = rows.slice(0, opts.limit)
  const last = page[page.length - 1]
  return {
    items: page.map(toFeedItem),
    nextCursor: rows.length > opts.limit && last ? encodeCursor(last.cursorTs, last.id) : null,
  }
}

function toFeedItem(r: FeedRow): FeedItem {
  return {
    id: r.id,
    createdAt: new Date(r.createdAt).toISOString(),
    status: r.status,
    rating: r.rating,
    note: r.note,
    film: { tmdbId: r.tmdbId, title: r.title, posterPath: r.posterPath, releaseYear: r.releaseYear },
    user: { username: r.username, displayName: r.displayName, avatarHue: r.avatarHue, kind: r.kind },
    likes: r.likes,
    likedByMe: r.likedByMe,
  }
}

export type WatchEntry = {
  tmdbId: number
  title: string
  posterPath: string | null
  backdropPath: string | null
  releaseYear: number | null
  genres: string[]
  status: WatchStatus
  rating: number | null
  note: string
  createdAt: string
  updatedAt: string
}

export const ENTRY_COLUMNS = `tmdb_id as "tmdbId", title, poster_path as "posterPath", backdrop_path as "backdropPath",
  release_year as "releaseYear", genres, status, rating, note, created_at as "createdAt", updated_at as "updatedAt"`

export async function listEntries(db: Db, userId: string, status?: WatchStatus) {
  return db.query<WatchEntry>(
    `select ${ENTRY_COLUMNS} from watch_entries
      where user_id = $1 and ($2::text is null or status = $2::text)
      order by updated_at desc, tmdb_id`,
    [userId, status ?? null],
  )
}
