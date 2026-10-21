import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CalendarDays, Pencil, UserX } from 'lucide-react'
import { BIO_MAX, DISPLAY_NAME_MAX, STATUS_LABELS, WATCH_STATUSES } from '../../shared/constants.ts'
import ActivityCard from '../components/ActivityCard'
import { Avatar, EmptyState, ErrorState, KindTag, Poster, Skeleton, STATUS_STYLES } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { memberSince } from '../lib/format'
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
      <main className="mx-auto max-w-3xl px-4 py-16">
        {res.error.status === 404 ? (
          <EmptyState icon={UserX} title="Player not found" action={<Link to="/feed" className="btn-ghost">Back to the feed</Link>}>
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

  return (
    <main>
      <section className="relative isolate overflow-hidden border-b border-white/[0.07]">
        {backdrop ? (
          <img src={backdrop} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_30%] opacity-60" />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-void via-void/70 to-void/10" />
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{ background: `radial-gradient(circle at 15% 100%, hsla(${profile.avatarHue}, 95%, 60%, 0.22), transparent 55%)` }}
        />
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-20 sm:pt-28">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <Avatar user={profile} size={96} className="ring-4 shadow-neon" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">{profile.displayName}</h1>
                <KindTag kind={profile.kind} />
              </div>
              <p className="mt-1 text-lg text-neon">@{profile.username}</p>
              {profile.bio ? <p className="mt-2 max-w-xl text-slate-200">{profile.bio}</p> : null}
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <CalendarDays className="h-4 w-4" /> Playing since {memberSince(profile.createdAt)}
                {spotlight ? <span className="hidden sm:inline"> · Banner: {spotlight.title}</span> : null}
              </p>
            </div>
            {profile.isMe ? <EditProfile profile={profile} onSaved={res.reload} /> : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <Stats stats={stats} />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_380px]">
          <section aria-labelledby="shelves" className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <h2 id="shelves" className="font-display text-xl font-bold uppercase text-white">
                Shelves
              </h2>
              <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Shelf">
                <button type="button" role="tab" className="tab" aria-selected={shelf === 'all'} onClick={() => setShelf('all')}>
                  All
                </button>
                {WATCH_STATUSES.filter((s) => stats[s] > 0).map((s) => (
                  <button key={s} type="button" role="tab" className="tab" aria-selected={shelf === s} onClick={() => setShelf(s)}>
                    {STATUS_LABELS[s]} <span className="opacity-70">{stats[s]}</span>
                  </button>
                ))}
              </div>
            </div>
            {shelfEntries.length === 0 ? (
              <EmptyState title="Empty shelf" action={profile.isMe ? <Link to="/log" className="btn-primary">Log a film</Link> : null}>
                {profile.isMe ? 'Films you log appear here.' : `@${profile.username} hasn't logged anything here yet.`}
              </EmptyState>
            ) : (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
                {shelfEntries.map((e) => (
                  <li key={e.tmdbId} className="group relative">
                    <Link to={`/log?film=${e.tmdbId}`} title={e.title}>
                      <Poster path={e.posterPath} title={e.title} className="w-full rounded-lg ring-1 ring-white/10 transition group-hover:ring-neon/50" />
                      <span
                        className={`absolute left-1.5 top-1.5 h-2 w-2 rounded-full ${STATUS_STYLES[e.status].bg}`}
                        aria-label={STATUS_LABELS[e.status]}
                      />
                      {e.rating ? (
                        <span className="absolute bottom-1.5 right-1.5 rounded bg-void/85 px-1.5 py-0.5 font-display text-[10px] font-bold text-acid backdrop-blur">
                          {e.rating}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="recent" className="min-w-0">
            <h2 id="recent" className="mb-5 font-display text-xl font-bold uppercase text-white">
              Recent activity
            </h2>
            {activity.length === 0 ? (
              <p className="text-muted">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 5).map((item) => (
                  <ActivityCard key={item.id} item={item} compact />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function Stats({ stats }) {
  const total = stats.logged || 0
  const tiles = [
    ['Logged', total, 'text-white'],
    ['Completed', stats.completed, 'text-acid'],
    ['Avg rating', stats.avgRating ? `${stats.avgRating}` : '—', 'text-acid'],
    ['Watching now', stats.watching, 'text-neon'],
  ]
  return (
    <section aria-label="Stats" className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
        {tiles.map(([label, value, color]) => (
          <div key={label} className="panel flex flex-col justify-between px-4 py-4">
            <p className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">{label}</p>
            <p className={`mt-2 font-display text-3xl font-black tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="panel p-5">
        <p className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">Status split</p>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/5" role="img" aria-label={WATCH_STATUSES.map((s) => `${stats[s]} ${STATUS_LABELS[s]}`).join(', ')}>
          {total
            ? WATCH_STATUSES.map((s) =>
                stats[s] ? <span key={s} style={{ width: `${(stats[s] / total) * 100}%`, background: STATUS_STYLES[s].bar }} className="h-full first:rounded-l-full last:rounded-r-full" /> : null,
              )
            : null}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {WATCH_STATUSES.map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[s].bg}`} />
              {STATUS_LABELS[s]} <span className="tabular-nums text-slate-300">{stats[s]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-display text-[10px] uppercase tracking-[0.25em] text-muted">Top genres</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {stats.topGenres.length ? (
            stats.topGenres.map((g) => (
              <span key={g.name} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-slate-200">
                {g.name} <span className="text-muted">{g.count}</span>
              </span>
            ))
          ) : (
            <span className="text-sm text-muted">Log a few films to see this.</span>
          )}
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
      <button type="button" onClick={() => setOpen(true)} className="btn-quiet btn-sm self-start sm:self-end">
        <Pencil className="h-3.5 w-3.5" /> Edit profile
      </button>
    )
  }
  return (
    <form
      className="panel w-full space-y-3 p-4 sm:w-80"
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
        <input id="dn" className="input-field py-2" value={displayName} maxLength={DISPLAY_NAME_MAX} onChange={(e) => setDisplayName(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="bio" className="field-label flex justify-between">
          <span>Bio</span>
          <span>
            {bio.length}/{BIO_MAX}
          </span>
        </label>
        <textarea id="bio" className="input-field min-h-20 resize-none py-2" value={bio} maxLength={BIO_MAX} onChange={(e) => setBio(e.target.value)} />
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
    <main aria-busy="true">
      <div className="border-b border-white/[0.07]">
        <div className="mx-auto flex max-w-6xl items-end gap-5 px-4 pb-8 pt-28">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-60" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-10 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </main>
  )
}
