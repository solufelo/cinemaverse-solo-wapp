import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Pencil, Plus, UserX } from 'lucide-react'
import { BIO_MAX, DISPLAY_NAME_MAX, STATUS_LABELS, WATCH_STATUSES } from '../../shared/constants.ts'
import ActivityCard from '../components/ActivityCard'
import { Avatar, EmptyState, ErrorState, KindTag, Poster, Skeleton, STATUS_STYLES } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { memberSince, splitPercents } from '../lib/format'
import { imageUrl } from '../lib/tmdb'

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
  const backdrop = imageUrl(spotlight?.backdropPath, 'w1280')
  const hue = profile.avatarHue

  return (
    <main>
      <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          {backdrop ? <img src={backdrop} alt="" fetchpriority="high" className="ken-burns absolute inset-0 h-full w-full object-cover object-[60%_35%] opacity-60" /> : null}
          <div className="scanlines absolute inset-0 opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-void via-void/75 to-void/0" />
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-void via-void/60 to-transparent" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(60% 80% at 0% 100%, hsla(${hue}, 95%, 60%, 0.18), transparent 70%)` }} />
        </div>

        <div className="frame flex min-h-[440px] flex-col justify-end gap-8 pb-12 pt-24 sm:min-h-[500px] lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <span className="hud-corners inline-flex self-start sm:self-end" style={{ '--inset': '-8px', '--corner': `hsl(${hue} 95% 64%)` }}>
              <Avatar user={profile} size={104} />
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
              <Link to={`/log?film=${spotlight.tmdbId}`} className="meta transition hover:text-white">
                Banner <span className="text-slate-600">/</span> <span className="text-slate-300">{spotlight.title}</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <Stats stats={stats} />

      <div className="frame mt-20 grid gap-16 lg:grid-cols-12 lg:gap-12">
        <section aria-labelledby="shelves" className="min-w-0 lg:col-span-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 id="shelves" className="t-h2">
              Shelves
            </h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted" aria-label="Legend">
              {WATCH_STATUSES.map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <span className={`h-[3px] w-3 ${STATUS_STYLES[s].bg}`} /> {STATUS_LABELS[s]}
                </li>
              ))}
            </ul>
          </div>
          <div className="tabs mb-8" role="tablist" aria-label="Shelf">
            <button type="button" role="tab" className="tab" aria-selected={shelf === 'all'} onClick={() => setShelf('all')}>
              All <span className="tab-count">{entries.length}</span>
            </button>
            {WATCH_STATUSES.filter((s) => stats[s] > 0).map((s) => (
              <button key={s} type="button" role="tab" className="tab" aria-selected={shelf === s} onClick={() => setShelf(s)}>
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
                <li key={e.tmdbId} className="group" data-reveal style={{ '--i': i % 5 }}>
                  <Link to={`/log?film=${e.tmdbId}`} className="block">
                    <span className="lock-on hud-corners block" style={{ '--inset': '-5px', '--corner-len': '10px' }}>
                      <span className="relative block overflow-hidden rounded-[4px] ring-1 ring-white/10 transition duration-500 group-hover:-translate-y-1 group-hover:ring-white/25">
                        <Poster path={e.posterPath} title={e.title} className="w-full" />
                        <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-[3px] ${STATUS_STYLES[e.status].bg}`} />
                        {e.rating ? (
                          <span className="absolute right-1.5 top-1.5 rounded-[3px] bg-void/85 px-1.5 py-1 font-display text-[10px] font-bold leading-none text-acid backdrop-blur">
                            {e.rating}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="mt-2.5 block truncate text-[14px] font-semibold text-slate-200 transition group-hover:text-white">{e.title}</span>
                    <span className={`block font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_STYLES[e.status].text}`}>{STATUS_LABELS[e.status]}</span>
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
            <p className="border-t border-white/[0.07] pt-5 text-muted">No activity yet.</p>
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

/** HUD readout: four numerals, the status split and top genres. */
function Stats({ stats }) {
  const total = stats.logged || 0
  const pct = splitPercents(Object.fromEntries(WATCH_STATUSES.map((s) => [s, stats[s] || 0])))
  const tiles = [
    ['Logged', total, 'text-white'],
    ['Completed', stats.completed, 'text-acid'],
    ['Avg rating', stats.avgRating ? Number(stats.avgRating).toFixed(1) : '—', 'text-acid'],
    ['Watching', stats.watching, 'text-neon'],
  ]
  return (
    <section aria-label="Stats" className="border-b border-white/[0.06]">
      <div className="frame">
        <dl className="grid grid-cols-2 border-white/[0.06] md:grid-cols-4 md:divide-x md:divide-white/[0.06]">
          {tiles.map(([label, value, color], i) => (
            <div key={label} className={`py-7 md:px-8 md:first:pl-0 ${i < 2 ? 'border-b border-white/[0.06] md:border-b-0' : ''}`}>
              <dt className="meta">{label}</dt>
              <dd className={`t-num mt-3 text-4xl sm:text-5xl ${color}`}>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="grid gap-8 border-t border-white/[0.06] py-8 md:grid-cols-12">
          <div className="md:col-span-7">
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
                  <span className={`h-1.5 w-1.5 ${STATUS_STYLES[s].bg}`} />
                  {STATUS_LABELS[s]} <span className="tabular-nums text-slate-200">{stats[s]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <p className="meta">Top genres</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {stats.topGenres.length ? (
                stats.topGenres.map((g) => (
                  <span key={g.name} className="rounded-[3px] border border-white/10 px-2.5 py-1 text-[14px] text-slate-200">
                    {g.name} <span className="font-mono text-[12px] text-muted">{g.count}</span>
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted">Log a few films to see this.</span>
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
      className="w-full animate-rise space-y-4 rounded-xl border border-white/10 bg-void/90 p-5 backdrop-blur-xl sm:w-80"
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

function ProfileSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading profile">
      <div className="border-b border-white/[0.06]">
        <div className="frame flex min-h-[440px] flex-col justify-end gap-6 pb-12 sm:min-h-[500px] sm:flex-row sm:items-end">
          <Skeleton className="h-[104px] w-[104px] rounded-full" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-12 w-72 max-w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
      <div className="frame grid grid-cols-2 gap-8 py-8 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-16" />
          </div>
        ))}
      </div>
    </main>
  )
}
