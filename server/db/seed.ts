import { createHash } from 'node:crypto'
import { CATALOG_BY_ID } from '../../shared/catalog.ts'
import type { WatchStatus } from '../../shared/constants.ts'
import type { Db } from './index.ts'

/**
 * Demo community: six fictional players (kind = 'demo', no password, can't be signed into)
 * whose watch logs fill the feed, profiles and recommendation pool on a fresh database.
 * Every demo profile is labelled "Demo" in the UI. Timestamps are relative to seed time.
 */
type SeedEntry = [tmdbId: number, status: WatchStatus, rating: number | null, note: string, hoursAgo: number]

export const DEMO_USERS: {
  username: string
  displayName: string
  hue: number
  bio: string
  entries: SeedEntry[]
}[] = [
  {
    username: 'nova',
    displayName: 'Nova',
    hue: 185,
    bio: 'Sci-fi or bust. Slowly rewatching every Villeneuve.',
    entries: [
      [693134, 'completed', 10, 'IMAX rewatch. The black-and-white arena sequence is still unreal.', 0.3],
      [157336, 'watching', null, 'Docking scene coming up. Volume all the way up.', 5],
      [62, 'planned', null, 'Finally doing it this weekend.', 30],
      [329865, 'completed', 9, 'Quiet, patient, devastating.', 50],
      [335984, 'completed', 9, '', 120],
      [603, 'completed', 9, '', 160],
      [438631, 'completed', 8, '', 200],
    ],
  },
  {
    username: 'pixel_rat',
    displayName: 'Pixel Rat',
    hue: 320,
    bio: 'Animation is cinema. Will defend Spider-Verse in the comments.',
    entries: [
      [569094, 'completed', 10, 'Every frame is a poster.', 2],
      [4935, 'watching', null, '', 9],
      [315162, 'completed', 8, 'The wolf scenes are genuinely scary.', 26],
      [4977, 'planned', null, 'Recommended by @cinema_ghost.', 44],
      [1022789, 'planned', null, '', 70],
      [129, 'completed', 9, '', 90],
      [324857, 'completed', 10, '', 140],
    ],
  },
  {
    username: 'cinema_ghost',
    displayName: 'Cinema Ghost',
    hue: 265,
    bio: 'Old films, late nights, no phone.',
    entries: [
      [37165, 'watching', null, '', 3.5],
      [78, 'completed', 9, 'Tears in rain. Still undefeated.', 7],
      [466420, 'dropped', null, 'Will come back to it. Not a weeknight film.', 36],
      [4977, 'completed', 9, 'Satoshi Kon was decades ahead.', 60],
      [194, 'completed', 8, '', 100],
      [238, 'completed', 10, '', 180],
      [62, 'completed', 10, '', 210],
    ],
  },
  {
    username: 'reel_ronin',
    displayName: 'Reel Ronin',
    hue: 25,
    bio: 'Crime, heists and anything with a long take.',
    entries: [
      [530915, 'watching', null, '', 1.2],
      [155, 'completed', 10, "The interrogation scene. That's the whole note.", 12],
      [496243, 'completed', 10, 'Watch it knowing nothing.', 80],
      [872585, 'completed', 9, '', 110],
      [680, 'completed', 9, '', 150],
      [27205, 'completed', 8, '', 190],
      [550, 'dropped', null, '', 230],
    ],
  },
  {
    username: 'kaiju_kid',
    displayName: 'Kaiju Kid',
    hue: 140,
    bio: "If it's big and stomping, I'm in.",
    entries: [
      [940721, 'completed', 10, 'Best Godzilla film. Not close.', 4],
      [120, 'watching', null, 'Extended edition. Pray for me.', 15],
      [693134, 'planned', null, '', 20],
      [76341, 'completed', 10, '', 66],
      [361743, 'completed', 8, '', 130],
      [263115, 'completed', 9, '', 175],
      [105, 'completed', 9, '', 205],
    ],
  },
  {
    username: 'velvet_static',
    displayName: 'Velvet Static',
    hue: 345,
    bio: 'Drama, music, and films that wreck me a little.',
    entries: [
      [244786, 'completed', 10, 'Left the room shaking. In a good way.', 1.6],
      [278, 'watching', null, '', 18],
      [545611, 'completed', 10, 'Cried at the rocks. Everyone does.', 40],
      [419430, 'planned', null, '', 55],
      [313369, 'completed', 9, '', 85],
      [792307, 'completed', 8, '', 115],
      [346698, 'completed', 7, '', 160],
      [14160, 'completed', 9, '', 220],
    ],
  },
]

/** Stable UUID from a label, so every sandbox instance seeds identical ids. */
export function stableId(label: string) {
  const h = createHash('sha1').update(`cinemaverse:${label}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`
}

export async function seedDemo(db: Db, now = new Date(), opts: { force?: boolean } = {}) {
  return db.transaction(async (tx) => {
    await tx.query('select pg_advisory_xact_lock(727275)')
    const [{ n }] = await tx.query<{ n: number }>("select count(*)::int as n from users where kind = 'demo'")
    if (n > 0 && !opts.force) return { seeded: false }

    const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3_600_000)
    const notedActivities: { id: string; owner: string }[] = []

    for (const u of DEMO_USERS) {
      const userId = stableId(`user:${u.username}`)
      await tx.query(
        `insert into users (id, username, display_name, bio, avatar_hue, kind, created_at)
         values ($1, $2, $3, $4, $5, 'demo', $6) on conflict (id) do nothing`,
        [userId, u.username, u.displayName, u.bio, u.hue, at(24 * 30)],
      )
      for (const [tmdbId, status, rating, note, hoursAgo] of u.entries) {
        const film = CATALOG_BY_ID.get(tmdbId)
        if (!film) throw new Error(`Seed film ${tmdbId} missing from catalog`)
        await tx.query(
          `insert into watch_entries
             (id, user_id, tmdb_id, title, poster_path, backdrop_path, release_year, genres, status, rating, note, created_at, updated_at)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
           on conflict (user_id, tmdb_id) do nothing`,
          [
            stableId(`entry:${u.username}:${tmdbId}`),
            userId,
            tmdbId,
            film.title,
            film.posterPath,
            film.backdropPath,
            film.releaseYear,
            film.genres,
            status,
            rating,
            note,
            at(hoursAgo),
          ],
        )
        // A finished film with a take also gets the earlier "watching" event, so the feed shows progress.
        const events: [WatchStatus, number | null, string, number][] =
          status === 'completed' && note
            ? [['watching', null, '', hoursAgo + 26], [status, rating, note, hoursAgo]]
            : [[status, rating, note, hoursAgo]]
        for (const [evStatus, evRating, evNote, evHours] of events) {
          const id = stableId(`activity:${u.username}:${tmdbId}:${evStatus}`)
          await tx.query(
            `insert into activity (id, user_id, tmdb_id, title, poster_path, release_year, status, rating, note, created_at)
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) on conflict (id) do nothing`,
            [id, userId, tmdbId, film.title, film.posterPath, film.releaseYear, evStatus, evRating, evNote, at(evHours)],
          )
          if (evNote) notedActivities.push({ id, owner: u.username })
        }
      }
    }

    // Deterministic likes between demo players on posts that have a written take.
    for (const [i, act] of notedActivities.entries()) {
      const likers = DEMO_USERS.filter((u) => u.username !== act.owner).slice(0, 1 + ((i * 7) % 4))
      for (const liker of likers) {
        await tx.query(
          'insert into activity_likes (activity_id, user_id) values ($1, $2) on conflict do nothing',
          [act.id, stableId(`user:${liker.username}`)],
        )
      }
    }
    return { seeded: true }
  })
}
