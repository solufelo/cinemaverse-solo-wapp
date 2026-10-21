import { z } from 'zod'
import { HttpError, json, readJson, validate } from '../http.ts'
import { listEntries, listFeed } from '../queries.ts'
import type { Router } from '../router.ts'
import { profilePatchSchema } from '../validation.ts'

const handleParam = z.string().trim().toLowerCase().regex(/^[a-z0-9_.]{3,20}$/, 'Not a valid username.')

export function registerUsers(router: Router) {
  // Public profile. Deliberately never returns email, role or ids.
  router.on('GET', '/api/users/:username', 'public', async ({ db, user, params }) => {
    const username = validate(handleParam, params.username)
    const [profile] = await db.query<{
      id: string
      username: string
      displayName: string
      bio: string
      avatarHue: number
      kind: string
      createdAt: Date
    }>(
      `select id, username, display_name as "displayName", bio, avatar_hue as "avatarHue", kind, created_at as "createdAt"
         from users where username = $1`,
      [username],
    )
    if (!profile) throw new HttpError(404, 'not_found', `No player called @${username}.`)

    const [stats] = await db.query<Record<string, number | null>>(
      `select count(*)::int as logged,
              count(*) filter (where status = 'completed')::int as completed,
              count(*) filter (where status = 'watching')::int as watching,
              count(*) filter (where status = 'planned')::int as planned,
              count(*) filter (where status = 'dropped')::int as dropped,
              count(rating)::int as rated,
              round(avg(rating)::numeric, 1)::float8 as "avgRating"
         from watch_entries where user_id = $1`,
      [profile.id],
    )
    const topGenres = await db.query<{ name: string; count: number }>(
      `select g as name, count(*)::int as count
         from watch_entries, unnest(genres) as g
        where user_id = $1 and status <> 'dropped'
        group by g order by count desc, g limit 4`,
      [profile.id],
    )
    const entries = await listEntries(db, profile.id)
    const activity = await listFeed(db, { viewerId: user?.id ?? null, userId: profile.id, limit: 8 })
    const spotlight =
      [...entries]
        .filter((e) => e.backdropPath && e.status !== 'dropped')
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0] ?? null

    const { id, ...publicProfile } = profile
    return json({
      profile: { ...publicProfile, isMe: user?.id === id },
      stats: { ...stats, topGenres },
      spotlight: spotlight && { title: spotlight.title, backdropPath: spotlight.backdropPath, tmdbId: spotlight.tmdbId },
      entries,
      activity: activity.items,
    })
  })

  router.on('PATCH', '/api/users/me', 'user', async ({ req, db, user }) => {
    const body = await readJson(req, profilePatchSchema)
    const [row] = await db.query<{ displayName: string; bio: string }>(
      `update users set display_name = coalesce($2, display_name), bio = coalesce($3, bio)
        where id = $1 returning display_name as "displayName", bio`,
      [user.id, body.displayName ?? null, body.bio ?? null],
    )
    return json({ profile: row })
  })
}
