import { z } from 'zod'
import { CATALOG, type CatalogFilm } from '../../shared/catalog.ts'
import type { WatchStatus } from '../../shared/constants.ts'
import type { Db } from '../db/index.ts'
import type { Env } from '../router.ts'
import { tmdbSearchFirst } from '../tmdb.ts'

export type Pick = {
  tmdbId: number | null
  title: string
  releaseYear: number | null
  posterPath: string | null
  backdropPath: string | null
  genres: string[]
  reason: string
}

export type Recommendations = {
  source: 'openrouter' | 'taste-match'
  model: string | null
  aiConfigured: boolean
  notice: string | null
  basedOn: number
  items: Pick[]
}

type Entry = {
  tmdbId: number
  title: string
  releaseYear: number | null
  genres: string[]
  status: WatchStatus
  rating: number | null
}

type Candidate = CatalogFilm & { communityAvg: number | null; communityCount: number }

export const DEFAULT_MODEL = 'openai/gpt-4o-mini'
const cache = new Map<string, { expires: number; value: Recommendations }>()

export async function recommend(opts: { db: Db; userId: string; env: Env; fetch: typeof fetch }) {
  const { db, userId, env } = opts
  const entries = await db.query<Entry>(
    `select tmdb_id as "tmdbId", title, release_year as "releaseYear", genres, status, rating
       from watch_entries where user_id = $1 order by updated_at desc limit 60`,
    [userId],
  )
  const aiConfigured = Boolean(env.OPENROUTER_API_KEY)
  let notice: string | null = null

  if (aiConfigured && entries.length > 0) {
    const key = `${userId}:${entries.map((e) => `${e.tmdbId}${e.status}${e.rating ?? ''}`).join(',')}`
    const hit = cache.get(key)
    if (hit && hit.expires > Date.now()) return hit.value
    try {
      const items = await openRouterPicks(entries, opts)
      if (items.length >= 3) {
        const value: Recommendations = {
          source: 'openrouter',
          model: env.OPENROUTER_MODEL || DEFAULT_MODEL,
          aiConfigured,
          notice: null,
          basedOn: entries.length,
          items,
        }
        cache.set(key, { expires: Date.now() + 10 * 60_000, value })
        return value
      }
      notice = 'The AI returned too few usable picks, so these are taste-match picks instead.'
    } catch (err) {
      console.warn('[recommend] OpenRouter failed, using taste-match', (err as Error).message)
      notice = 'The AI service did not answer in time, so these are taste-match picks instead.'
    }
  }

  const candidates = await communityCandidates(db, userId)
  return {
    source: 'taste-match',
    model: null,
    aiConfigured,
    notice,
    basedOn: entries.length,
    items: tasteMatch(entries, candidates),
  } satisfies Recommendations
}

/** Catalog films plus anything the community has logged, with community average ratings. */
async function communityCandidates(db: Db, userId: string): Promise<Candidate[]> {
  const rows = await db.query<{
    tmdbId: number
    title: string
    releaseYear: number | null
    posterPath: string | null
    backdropPath: string | null
    genres: string[]
    avg: number | null
    n: number
  }>(
    `select tmdb_id as "tmdbId", max(title) as title, max(release_year) as "releaseYear",
            max(poster_path) as "posterPath", max(backdrop_path) as "backdropPath",
            -- jsonb, not array_agg(genres): array_agg needs every array the same length and
            -- players can log the same film with different genre lists.
            (jsonb_agg(to_jsonb(genres) order by cardinality(genres) desc)) -> 0 as genres,
            avg(rating)::float8 as avg, count(*)::int as n
       from watch_entries where user_id <> $1 and status <> 'dropped'
      group by tmdb_id`,
    [userId],
  )
  const byId = new Map<number, Candidate>()
  for (const f of CATALOG) byId.set(f.tmdbId, { ...f, communityAvg: null, communityCount: 0 })
  for (const r of rows) {
    const base = byId.get(r.tmdbId)
    byId.set(r.tmdbId, {
      tmdbId: r.tmdbId,
      title: base?.title ?? r.title,
      releaseYear: base?.releaseYear ?? r.releaseYear,
      posterPath: base?.posterPath ?? r.posterPath,
      backdropPath: base?.backdropPath ?? r.backdropPath,
      genres: base?.genres.length ? base.genres : (r.genres ?? []),
      voteAverage: base?.voteAverage ?? 7,
      communityAvg: r.avg,
      communityCount: r.n,
    })
  }
  return [...byId.values()]
}

const STATUS_WEIGHT: Record<WatchStatus, number> = { completed: 2, watching: 1.5, planned: 1, dropped: -2 }

/**
 * Content-based fallback: build a genre-affinity profile from the player's log
 * (ratings above 5 pull towards a genre, low ratings and drops push away), score
 * unseen films by affinity + community + TMDB rating, and explain each pick.
 */
export function tasteMatch(entries: Entry[], candidates: Candidate[], limit = 8): Pick[] {
  const seen = new Set(entries.map((e) => e.tmdbId))
  const affinity = new Map<string, number>()
  for (const e of entries) {
    const w = e.status === 'completed' && e.rating ? e.rating - 5 : STATUS_WEIGHT[e.status]
    for (const g of e.genres) affinity.set(g, (affinity.get(g) ?? 0) + w)
  }
  const anchors = entries.filter((e) => e.status !== 'dropped' && (e.rating === null || e.rating >= 7))

  const scored = candidates
    .filter((c) => !seen.has(c.tmdbId))
    .map((c) => {
      const genreScore = c.genres.length
        ? c.genres.reduce((s, g) => s + (affinity.get(g) ?? 0), 0) / Math.sqrt(c.genres.length)
        : 0
      const community = c.communityAvg ? (c.communityAvg - 6) * 0.6 * Math.min(c.communityCount, 3) : 0
      const score = genreScore + community + c.voteAverage * 0.3
      return { c, score }
    })
    .sort((a, b) => b.score - a.score || a.c.title.localeCompare(b.c.title))
    .slice(0, limit)

  return scored.map(({ c }) => ({
    tmdbId: c.tmdbId,
    title: c.title,
    releaseYear: c.releaseYear,
    posterPath: c.posterPath,
    backdropPath: c.backdropPath,
    genres: c.genres,
    reason: explain(c, anchors, affinity),
  }))
}

function explain(c: Candidate, anchors: Entry[], affinity: Map<string, number>) {
  let best: { anchor: Entry; shared: string[] } | null = null
  for (const anchor of anchors) {
    const shared = c.genres.filter((g) => anchor.genres.includes(g) && (affinity.get(g) ?? 0) > 0)
    if (shared.length && (!best || shared.length > best.shared.length || (anchor.rating ?? 0) > (best.anchor.rating ?? 0) && shared.length === best.shared.length)) {
      best = { anchor, shared }
    }
  }
  const community =
    c.communityAvg && c.communityCount > 0
      ? ` Players rate it ${Number(c.communityAvg.toFixed(1))}/10.`
      : ''
  if (best) {
    const how = best.anchor.rating ? `you rated ${best.anchor.title} ${best.anchor.rating}/10` : `${best.anchor.title} is on your list`
    return `Because ${how} · ${best.shared.slice(0, 2).join(' + ')}.${community}`
  }
  if (community) return `Community favourite.${community}`
  return `Highly rated on TMDB (${c.voteAverage.toFixed(1)}/10).`
}

const aiPicksSchema = z.object({
  picks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        year: z.coerce.number().int().min(1870).max(2100).nullable().optional(),
        reason: z.string().trim().min(1).max(300),
      }),
    )
    .min(1)
    .max(12),
})

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

async function openRouterPicks(entries: Entry[], { env, fetch: fetchImpl }: { env: Env; fetch: typeof globalThis.fetch }): Promise<Pick[]> {
  const list = entries
    .slice(0, 30)
    .map((e) => `- ${e.title}${e.releaseYear ? ` (${e.releaseYear})` : ''}: ${e.status}${e.rating ? `, rated ${e.rating}/10` : ''}`)
    .join('\n')
  const res = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: {
      authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'content-type': 'application/json',
      'http-referer': env.PUBLIC_SITE_URL || 'https://cinemaverse-solo.netlify.app',
      'x-title': 'CinemaVerse',
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL || DEFAULT_MODEL,
      temperature: 0.7,
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You recommend feature films. Reply with JSON only: {"picks":[{"title":string,"year":number,"reason":string}]}. ' +
            'Give 6 real films the user has not logged. Each reason is one sentence under 140 characters that names something specific from their log.',
        },
        { role: 'user', content: `My film log:\n${list}\n\nRecommend 6 films for me.` },
      ],
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content ?? ''
  const jsonText = content.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  const parsed = aiPicksSchema.parse(JSON.parse(jsonText))

  const logged = new Set(entries.map((e) => norm(e.title)))
  const catalog = new Map(CATALOG.map((f) => [norm(f.title), f]))
  const picks = parsed.picks.filter((p) => !logged.has(norm(p.title))).slice(0, 8)

  return Promise.all(
    picks.map(async (p): Promise<Pick> => {
      const known = catalog.get(norm(p.title)) ?? (await tmdbSearchFirst(p.title, p.year ?? null, env, fetchImpl).catch(() => null))
      return {
        tmdbId: known?.tmdbId ?? null,
        title: known?.title ?? p.title,
        releaseYear: known?.releaseYear ?? p.year ?? null,
        posterPath: known?.posterPath ?? null,
        backdropPath: known?.backdropPath ?? null,
        genres: known?.genres ?? [],
        reason: p.reason,
      }
    }),
  )
}
