import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Film, LogOut, Menu, Play, X, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar } from './ui'

const links = [
  { to: '/feed', label: 'Feed' },
  { to: '/log', label: 'Log' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/for-you', label: 'For you' },
]

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="CinemaVerse home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-neon to-plasma shadow-neon">
        <Film className="h-[18px] w-[18px] text-void" />
        <Zap className="absolute -right-1 -top-1 h-3 w-3 fill-acid text-acid" />
      </span>
      <span className="font-display text-[17px] font-bold tracking-wide text-white">
        CINEMA<span className="text-neon">VERSE</span>
      </span>
    </Link>
  )
}

export function DemoButton({ className = 'btn-primary', children = 'Try the demo', to = '/log' }) {
  const { startDemo } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          const u = await startDemo()
          toast.push({ message: `You're in as ${u?.displayName ?? 'a guest'}. Log your first film.` })
          navigate(to)
        } catch (err) {
          toast.push({ tone: 'error', message: err.message })
        } finally {
          setBusy(false)
        }
      }}
    >
      <Play className="h-4 w-4" />
      {busy ? 'Starting…' : children}
    </button>
  )
}

export default function Navbar() {
  const { user, signOut, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => setOpen(false), [location.pathname])

  const out = async () => {
    await signOut()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `rounded-md px-3.5 py-2 font-display text-[12px] uppercase tracking-[0.16em] transition ${
      isActive ? 'bg-neon/10 text-neon' : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden min-w-[180px] items-center justify-end gap-2 md:flex">
          {loading ? null : user ? (
            <>
              <Link
                to={`/u/${user.username}`}
                className="flex items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-3 text-sm text-slate-200 transition hover:border-neon/40"
              >
                <Avatar user={user} size={28} />
                <span className="max-w-[120px] truncate font-semibold">{user.displayName}</span>
              </Link>
              <button type="button" onClick={out} className="btn-quiet btn-sm" aria-label="Sign out">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-quiet btn-sm">
                Sign in
              </Link>
              <Link to="/signup" className="btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-panel/95 px-4 pb-5 pt-3 md:hidden">
          <nav className="grid gap-1" aria-label="Mobile">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 border-t border-white/10 pt-4">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <Link to={`/u/${user.username}`} className="flex items-center gap-2">
                  <Avatar user={user} size={32} />
                  <span className="font-semibold text-ink">{user.displayName}</span>
                </Link>
                <button type="button" onClick={out} className="btn-quiet btn-sm">
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className="btn-quiet">
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
