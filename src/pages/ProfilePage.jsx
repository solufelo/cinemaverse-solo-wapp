import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Pencil, Plus, Radio, Tags, UserX } from 'lucide-react'
import { BIO_MAX, DISPLAY_NAME_MAX, STATUS_LABELS, WATCH_STATUSES } from '../../shared/constants.ts'
import ActivityCard from '../components/ActivityCard'
import { Avatar, EmptyState, ErrorState, KindTag, MiniEmpty, Poster, Skeleton, STATUS_STYLES, StatusMark } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { memberSince, pad2, splitPercents } from '../lib/format'
import { backdropFocus, imageUrl } from '../lib/tmdb'

// Banner geometry with art, shared with the skeleton so loading never shifts the page.
const BANNER_ART = 'min-h-[420px] pt-40 lg:min-h-[440px] lg:pt-24'

/** /profile -> your own public page (or sign in). */
export function MyProfileRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  return <Navigate to={user ? `/u/${user.username}` : '/login'} replace state={{ from: '/profile' }} />
}

// Keyed by username so tab state resets when you jump from one profile to another.
export default function ProfileRoute() {
  const { username } = useParams()
  return <ProfilePage key={username} username={username} />
}

function ProfilePage({ username }) {
  const res = useApi(`/users/${encodeURIComponent(username)}`)
  const [shelf, setShelf] = useState('all')

  if (res.loading && !res.data) return <ProfileSkeleton />
  if (res.error) {
    return (
      <main className="frame max-w-3xl pt-20">
        {res.error.status === 404 ? (
          <EmptyState
            icon={UserX}
            label="Error 404 / player"
            title="Player not found"
            action={
              <Link to="/feed" className="btn-ghost">
                Back to the feed
              </Link>
            }
          >
            There is no player called @{username}.
          </EmptyState>
        ) : (
          <ErrorState error={res.error} onRetry={res.reload} title="This profile didn't load" />
        )}
      </main>
    )
  }

  const { profile, stats, spotlight, entries, activity } = res.data
  const shelfEntries = shelf === 'all' ? entries : entries.filter((e) => e.status === shelf)
  const art = spotlight?.backdropPath
  const hue = profile.avatarHue

  return (
    <main>
      <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          {/* The still keeps to the right (and, on phones, the top) and fades out before the text, so a face never sits under the name or avatar. */}
          {art ? (
            <img
              src={imageUrl(art, 'w1280')}
              srcSet={`${imageUrl(art, 'w780')} 780w, ${imageUrl(art, 'w1280')} 1280w, ${imageUrl(art, 'original')} 2400w`}
              sizes="(min-width: 1024px) 62vw, 100vw"
              alt=""
              fetchpriority="high"
              style={{ objectPosition: backdropFocus(spotlight.tmdbId) }}
              className="absolute right-0 top-0 h-[64%] w-[80%] object-cover opacity-80 grayscale-[0.3] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_40%),linear-gradient(to_bottom,black_30%,transparent)] lg:h-full lg:w-[62%] lg:[mask-image:linear-gradient(to_right,transparent,black_40%)]"
            />
          ) : null}
          {/* Tint the banner in the player's own hue, so every profile reads as theirs whatever the film. */}
          <div className="absolute inset-0 mix-blend-color" style={{ background: `hsla(${hue}, 90%, 55%, 0.38)` }} />
          <div className="scanlines absolute inset-0 opacity-30" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void to-transparent" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(60% 80% at 0% 100%, hsla(${hue}, 95%, 60%, 0.18), transparent 70%)` }} />
        </div>

        <div className={`frame flex flex-col justify-end gap-8 pb-12 lg:flex-row lg:items-end lg:justify-between ${art ? BANNER_ART : 'pt-14 sm:pt-20'}`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            {/* Brackets sit inside the avatar's box so they stay on the page gutter. */}
            <span className="hud-corners inline-flex self-start p-2 sm:self-end" style={{ '--inset': '0px', '--corner': `hsl(${hue} 95% 64%)` }}>
              <Avatar user={profile} size={96} />
            </span>
            <div className="min-w-0">
              <p className="hud-label" style={{ '--mark': `hsl(${hue} 95% 64%)` }}>
                Player profile {profile.kind !== 'user' ? <KindTag kind={profile.kind} /> : null}
              </p>
              <h1 className="t-h1 mt-4 break-words">{profile.displayName}</h1>
              <p className="mt-3 font-mono text-[13px] text-neon">@{profile.username}</p>
              {profile.bio ? <p className="mt-4 max-w-xl text-[17px] text-slate-200">{profile.bio}</p> : null}
              <p className="meta mt-4">Playing since {memberSince(profile.createdAt)}</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            {profile.isMe ? <EditProfile profile={profile} onSaved={res.reload} /> : null}
            {spotlight ? (
              <Link to={`/log?film=${spotlight.tmdbId}`} className="meta py-1 transition hover:text-white">
                Banner <span className="text-slate-600">/</span> <span className="text-slate-300">{spotlight.title}</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <Stats stats={stats} isMe={profile.isMe} />

      <div className="frame mt-20 grid gap-16 lg:grid-cols-12 lg:gap-12">
        <section aria-labelledby="shelves" className="min-w-0 lg:col-span-8">
          <h2 id="shelves" className="t-h2 mb-8">
            Shelves
          </h2>
          <div className="tabs tabs-seg mb-8" role="tablist" aria-label="Shelf">
            <button type="button" role="tab" className="tab" aria-selected={shelf === 'all'} onClick={() => setShelf('all')}>
              <span className="h-2 w-2 bg-current sm:hidden" aria-hidden="true" />
              All <span className="tab-count">{entries.length}</span>
            </button>
            {WATCH_STATUSES.filter((s) => stats[s] > 0).map((s) => (
              <button key={s} type="button" role="tab" className="tab" aria-selected={shelf === s} onClick={() => setShelf(s)}>
                <StatusMark status={s} className={STATUS_STYLES[s].text} />
                {STATUS_LABELS[s]} <span className="tab-count">{stats[s]}</span>
              </button>
            ))}
          </div>
          {shelfEntries.length === 0 ? (
            <EmptyState
              label="Shelf empty"
              title={profile.isMe ? 'Nothing logged yet' : 'Empty shelf'}
              action={
                profile.isMe ? (
                  <Link to="/log" className="btn-primary">
                    <Plus className="h-4 w-4" /> Log a film
                  </Link>
                ) : null
              }
            >
              {profile.isMe ? 'Films you log appear here, sorted by status.' : `@${profile.username} hasn't logged anything here yet.`}
            </EmptyState>
          ) : (
            <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-4 xl:grid-cols-5">
              {shelfEntries.map((e, i) => (
                <li key={e.tmdbId} className="group" data-reveal="scan" style={{ '--i': i % 5 }}>
                  <Link to={`/log?film=${e.tmdbId}`} className="block">
                    <span className="lock-on hud-corners block" style={{ '--inset': '-5px', '--corner-len': '10px' }}>
                      <span className="relative block overflow-hidden rounded-[4px] ring-1 ring-white/10 transition duration-500 group-hover:-translate-y-1 group-hover:ring-white/25">
                        <Poster path={e.posterPath} title={e.title} className="w-full" />
                        <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-[3px] ${STATUS_STYLES[e.status].bg}`} />
                        {e.rating ? (
                          <span className="absolute right-1.5 top-1.5 rounded-[3px] bg-void/85 px-1.5 py-1 font-mono text-[11px] font-semibold leading-none text-acid backdrop-blur">
                            {e.rating}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="mt-2.5 line-clamp-3 text-[14px] font-semibold leading-snug text-slate-200 transition group-hover:text-white">{e.title}</span>
                    <span className={`mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_STYLES[e.status].text}`}>
                      <StatusMark status={e.status} />
                      {STATUS_LABELS[e.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent" className="min-w-0 lg:col-span-4">
          <h2 id="recent" className="t-h2 mb-6">
            Recent
          </h2>
          {activity.length === 0 ? (
            <MiniEmpty
              icon={Radio}
              action={
                profile.isMe ? (
                  <Link to="/log" className="link-arrow shrink-0">
                    Log <Plus className="h-3.5 w-3.5" />
                  </Link>
                ) : null
              }
            >
              {profile.isMe ? 'Your logs and status changes land here.' : 'No logs or status changes yet.'}
            </MiniEmpty>
          ) : (
            <div className="divide-y divide-white/[0.06] border-t border-white/[0.07]">
              {activity.slice(0, 6).map((item) => (
                <ActivityCard key={item.id} item={item} compact />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

/**
 * HUD readout: four numerals, then the status split and top genres on the same four-column
 * grid, so the split bar ends exactly at the second divider.
 */
function Stats({ stats, isMe }) {
  const total = stats.logged || 0
  const pct = splitPercents(Object.fromEntries(WATCH_STATUSES.map((s) => [s, stats[s] || 0])))
  const tiles = [
    ['Logged', pad2(total), 'text-white'],
    ['Completed', pad2(stats.completed || 0), 'text-acid'],
    ['Avg rating', stats.avgRating ? Number(stats.avgRating).toFixed(1) : '—', 'text-acid'],
    ['Watching', pad2(stats.watching || 0), 'text-neon'],
  ]
  return (
    <section aria-label="Stats" className="border-b border-white/[0.06]">
      <div className="frame">
        <dl className="grid grid-cols-2 md:grid-cols-4">
          {tiles.map(([label, value, color], i) => (
            <div
              key={label}
              className={`border-white/[0.06] py-7 md:px-8 md:first:pl-0 ${i % 2 ? 'border-l pl-6' : ''} ${i === 2 ? 'md:border-l' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''}`}
            >
              <dt className="meta">{label}</dt>
              <dd className={`t-num mt-3 text-[2.5rem] leading-none sm:text-5xl ${total ? color : 'text-slate-600'}`}>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="grid border-t border-white/[0.06] md:grid-cols-4">
          <div className="py-8 md:col-span-2 md:pr-8">
            <p className="meta">Status split</p>
            <div
              className="mt-4 flex h-2 gap-[3px] overflow-hidden"
              role="img"
              aria-label={WATCH_STATUSES.map((s) => `${stats[s]} ${STATUS_LABELS[s]}`).join(', ')}
            >
              {total ? (
                WATCH_STATUSES.map((s) => (pct[s] ? <span key={s} style={{ width: `${pct[s]}%`, background: STATUS_STYLES[s].bar }} className="h-full" /> : null))
              ) : (
                <span className="h-full w-full bg-white/[0.06]" />
              )}
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
              {WATCH_STATUSES.map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <StatusMark status={s} className={STATUS_STYLES[s].text} />
                  {STATUS_LABELS[s]} <span className="tabular-nums text-slate-200">{stats[s]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-white/[0.06] py-8 md:col-span-2 md:border-l md:border-t-0 md:pl-8">
            <p className="meta">Top genres</p>
            <div className="mt-4">
              {stats.topGenres.length ? (
                <div className="flex flex-wrap gap-2">
                  {stats.topGenres.map((g) => (
                    <span key={g.name} className="rounded-[3px] border border-white/10 px-2.5 py-1 text-[14px] text-slate-200">
                      {g.name} <span className="font-mono text-[12px] text-muted">{g.count}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <MiniEmpty icon={Tags}>{isMe ? 'Log a few films and your top genres show up here.' : 'Shows up once a few films are logged.'}</MiniEmpty>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function EditProfile({ profile, onSaved }) {
  const toast = useToast()
  const { refresh } = useAuth()
  const [open, setOpen] = useState(false)
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.bio)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost btn-sm">
        <Pencil className="h-3.5 w-3.5" /> Edit profile
      </button>
    )
  }
  return (
    <form
      className="w-full animate-rise space-y-4 rounded-[4px] border border-white/10 bg-void/90 p-5 backdrop-blur-xl sm:w-80"
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
          await api('/users/me', { method: 'PATCH', body: { displayName, bio } })
          await Promise.all([onSaved(), refresh()])
          toast.push({ message: 'Profile updated.' })
          setOpen(false)
        } catch (err) {
          setError(err.message)
        } finally {
          setSaving(false)
        }
      }}
    >
      <div>
        <label htmlFor="dn" className="field-label">
          Display name
        </label>
        <input id="dn" className="input-field py-2.5" value={displayName} maxLength={DISPLAY_NAME_MAX} onChange={(e) => setDisplayName(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="bio" className="field-label flex justify-between">
          <span>Bio</span>
          <span className="tabular-nums">
            {bio.length}/{BIO_MAX}
          </span>
        </label>
        <textarea id="bio" className="input-field min-h-20 resize-none py-2.5" value={bio} maxLength={BIO_MAX} onChange={(e) => setBio(e.target.value)} />
      </div>
      {error ? <p className="text-sm text-ember">{error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary btn-sm flex-1">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-quiet btn-sm">
          Cancel
        </button>
      </div>
    </form>
  )
}

/** Same boxes as the loaded page (banner with art, then the stat tiles), so nothing jumps. */
function ProfileSkeleton() {
  return (
    // Fills the screen so the footer never sits in view and jumps when the shelves arrive.
    <main aria-busy="true" aria-label="Loading profile" className="min-h-[100svh]">
      <section className="border-b border-white/[0.06]">
        <div className={`frame flex flex-col justify-end gap-8 pb-12 ${BANNER_ART}`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <span className="p-2">
              <Skeleton className="h-24 w-24 rounded-full" />
            </span>
            <div className="flex-1 space-y-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-12 w-72 max-w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </section>
      <section className="border-b border-white/[0.06]">
        <div className="frame">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={`py-7 md:px-8 md:first:pl-0 ${i % 2 ? 'pl-6' : ''}`}>
                <Skeleton className="h-[17px] w-20" />
                <Skeleton className="mt-3 h-10 w-16 sm:h-12" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
