import { HttpError, json, validate } from '../http.ts'
import { listFeed } from '../queries.ts'
import type { Router } from '../router.ts'
import { feedQuerySchema, uuidParam } from '../validation.ts'

export function registerFeed(router: Router) {
  // Public: anyone can read the feed. Signed-in viewers also get likedByMe.
  router.on('GET', '/api/feed', 'public', async ({ db, user, url }) => {
    const q = validate(feedQuerySchema, Object.fromEntries(url.searchParams))
    const page = await listFeed(db, { viewerId: user?.id ?? null, status: q.status, limit: q.limit, cursor: q.cursor })
    return json(page)
  })

  router.on('POST', '/api/feed/:id/like', 'user', async ({ db, user, params }) => {
    const id = validate(uuidParam, params.id)
    const [exists] = await db.query('select 1 from activity where id = $1', [id])
    if (!exists) throw new HttpError(404, 'not_found', 'That post no longer exists.')
    await db.query('insert into activity_likes (activity_id, user_id) values ($1, $2) on conflict do nothing', [
      id,
      user.id,
    ])
    return json(await likeState(db, id, user.id))
  })

  router.on('DELETE', '/api/feed/:id/like', 'user', async ({ db, user, params }) => {
    const id = validate(uuidParam, params.id)
    await db.query('delete from activity_likes where activity_id = $1 and user_id = $2', [id, user.id])
    return json(await likeState(db, id, user.id))
  })

  // Owners can delete their own posts; admins can remove anyone's (moderation).
  router.on('DELETE', '/api/feed/:id', 'user', async ({ db, user, params }) => {
    const id = validate(uuidParam, params.id)
    const [post] = await db.query<{ userId: string }>('select user_id as "userId" from activity where id = $1', [id])
    if (!post) throw new HttpError(404, 'not_found', 'That post no longer exists.')
    if (post.userId !== user.id && user.role !== 'admin') {
      throw new HttpError(403, 'forbidden', 'You can only delete your own posts.')
    }
    await db.query('delete from activity where id = $1', [id])
    return json({ ok: true })
  })
}

async function likeState(db: Parameters<typeof listFeed>[0], id: string, userId: string) {
  const [row] = await db.query<{ likes: number; likedByMe: boolean }>(
    `select (select count(*)::int from activity_likes where activity_id = $1) as likes,
            exists(select 1 from activity_likes where activity_id = $1 and user_id = $2) as "likedByMe"`,
    [id, userId],
  )
  return row
}
