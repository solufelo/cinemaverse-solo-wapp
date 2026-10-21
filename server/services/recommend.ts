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

/** The squad member who rated a film highest, with their take if they wrote one. */
type Fan = { name: string; rating: number | null; note: string }
type Candidate = CatalogFilm & { communityAvg: number | null; communityCount: number; fan?: Fan | null }

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
    fan: Fan | null
  }>(
    `select w.tmdb_id as "tmdbId", max(w.title) as title, max(w.release_year) as "releaseYear",
            max(w.poster_path) as "posterPath", max(w.backdrop_path) as "backdropPath",
            -- jsonb, not array_agg(genres): array_agg needs every array the same length and
            -- players can log the same film with different genre lists.
            (jsonb_agg(to_jsonb(w.genres) order by cardinality(w.genres) desc)) -> 0 as genres,
            avg(w.rating)::float8 as avg, count(*)::int as n,
            (jsonb_agg(jsonb_build_object('name', u.display_name, 'rating', w.rating, 'note', w.note)
               order by w.rating desc nulls last, (w.note <> '') desc, w.updated_at desc)) -> 0 as fan
       from watch_entries w join users u on u.id = w.user_id
      -- Guests' logs are private to them, so they never shape anyone else's picks.
      where w.user_id <> $1 and w.status <> 'dropped' and u.kind <> 'guest'
      group by w.tmdb_id`,
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
      fan: r.fan,
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

  const used = { anchors: new Map<number, number>(), fans: new Map<string, number>() }
  return scored.map(({ c }) => ({
    tmdbId: c.tmdbId,
    title: c.title,
    releaseYear: c.releaseYear,
    posterPath: c.posterPath,
    backdropPath: c.backdropPath,
    genres: c.genres,
    reason: explain(c, anchors, affinity, used),
  }))
}

/**
 * One line on why this film, written so a page of picks doesn't repeat itself: each pick leans
 * on the log entry (anchor) or squad member (fan) that has been mentioned least so far.
 */
function explain(
  c: Candidate,
  anchors: Entry[],
  affinity: Map<string, number>,
  used: { anchors: Map<number, number>; fans: Map<string, number> },
) {
  let best: { anchor: Entry; shared: string[]; score: number } | null = null
  for (const anchor of anchors) {
    const shared = c.genres.filter((g) => anchor.genres.includes(g) && (affinity.get(g) ?? 0) > 0)
    if (!shared.length) continue
    const score = shared.length * 2 - (used.anchors.get(anchor.tmdbId) ?? 0) * 3 + (anchor.rating ?? 6) / 10
    if (!best || score > best.score) best = { anchor, shared, score }
  }
  const fan = c.fan?.rating && c.fan.rating >= 7 ? c.fan : null
  const anchorUses = best ? (used.anchors.get(best.anchor.tmdbId) ?? 0) : 0
  const fanUses = fan ? (used.fans.get(fan.name) ?? 0) : 0
  const mention = (what: 'anchor' | 'fan' | 'both') => {
    if (best && what !== 'fan') used.anchors.set(best.anchor.tmdbId, anchorUses + 1)
    if (fan && what !== 'anchor') used.fans.set(fan.name, fanUses + 1)
  }
  const genres = best?.shared.slice(0, 2).join(' + ')

  if (best && anchorUses === 0) {
    mention('anchor')
    const a = best.anchor
    return a.rating ? `Because you rated ${a.title} ${a.rating}/10 · ${genres}.` : `${a.title} is on your list · ${genres}.`
  }
  if (fan && fanUses === 0) {
    mention('fan')
    const take = fan.note && fan.note.length <= 90 ? `: “${fan.note}”` : '.'
    return `${fan.name} gave it ${fan.rating}/10${take}`
  }
  if (best && anchorUses === 1) {
    mention('anchor')
    return `More ${best.shared[0].toLowerCase()} in the vein of ${best.anchor.title}.`
  }
  if (best && fan) {
    mention('both')
    return `${fan.name} gave it ${fan.rating}/10, and it shares ${genres} with ${best.anchor.title}.`
  }
  if (fan) {
    mention('fan')
    const others = c.communityCount - 1
    return `${fan.name} gave it ${fan.rating}/10${others > 0 ? `, and ${others} more in the squad logged it` : ''}.`
  }
  if (best) {
    mention('anchor')
    return `Shares ${genres} with ${best.anchor.title}. TMDB average ${c.voteAverage.toFixed(1)}.`
  }
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
