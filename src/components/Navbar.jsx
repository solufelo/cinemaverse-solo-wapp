import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ListVideo, LogOut, Play, Plus, Radio, Sparkles, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar } from './ui'

const links = [
  { to: '/feed', label: 'Feed' },
  { to: '/log', label: 'Log' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/for-you', label: 'For you' },
]

/** The mark: a play glyph locked inside HUD corner brackets. Same drawing as the favicon. */
export function Mark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M8 20V8h12M44 8h12v12M56 44v12H44M20 56H8V44" stroke="#00f5ff" strokeWidth="4" strokeLinecap="square" />
      <path d="M25 20v24l19-12-19-12z" fill="#eef1f8" />
      <rect x="46" y="14" width="6" height="6" fill="#ff2d95" />
    </svg>
  )
}

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="CinemaVerse home">
      <Mark className="h-8 w-8 transition-transform duration-500 ease-out group-hover:rotate-90" />
      <span className="font-display text-[15px] font-extrabold uppercase tracking-[0.04em] text-white">
        Cinema<span className="text-neon">verse</span>
      </span>
    </Link>
  )
}

export function DemoButton({ className = 'btn-primary', children = 'Try the demo', to = '/log', icon = true }) {
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
      {icon ? <Play className="h-3.5 w-3.5 fill-current" /> : null}
      {busy ? 'Starting…' : children}
    </button>
  )
}

// The "you are here" bar sits on the header's bottom edge; the link itself stays label-sized so
// its focus ring hugs the text like the buttons' rings do.
const navItem = (isActive) =>
  `relative inline-flex h-8 items-center font-mono text-[12px] uppercase tracking-[0.14em] transition after:absolute after:inset-x-0 after:-bottom-[17px] after:h-[2px] after:origin-left after:bg-neon after:transition-transform after:duration-300 ${
    isActive ? 'text-white after:scale-x-100' : 'text-muted after:scale-x-0 hover:text-white'
  }`

export default function Navbar() {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const out = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? 'border-white/[0.07] bg-void/80 backdrop-blur-xl' : 'border-transparent bg-void/40 backdrop-blur-md'
      }`}
    >
      {/* Three columns (1fr auto 1fr): the centre nav never moves while the auth slot resolves. */}
      <div className="frame flex h-16 items-center justify-between gap-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        <div className="justify-self-start">
          <Logo />
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => navItem(isActive)}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2 justify-self-end">
          {loading ? null : user ? (
            <>
              <Link
                to={`/u/${user.username}`}
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 text-sm text-slate-200 transition hover:bg-white/[0.05] sm:pr-3.5"
                aria-label="Your profile"
              >
                <Avatar user={user} size={30} />
                <span className="hidden max-w-[120px] truncate font-semibold sm:inline">{user.displayName}</span>
              </Link>
              <button type="button" onClick={out} className="btn-icon hidden md:inline-flex" aria-label="Sign out" title="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `${navItem(isActive)} mr-3 max-sm:hidden`}>
                Sign in
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) => `btn-sm ${isActive ? 'btn-quiet text-white' : 'btn-primary'} after:absolute after:inset-x-0 after:-bottom-[15px] after:h-[2px] after:bg-neon ${isActive ? 'after:block' : 'after:hidden'}`}
              >
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

/** Phone navigation: a thumb-reach tab bar with the logger as the centre action. */
export function TabBar() {
  const { user } = useAuth()
  const item = ({ isActive }) =>
    `relative flex flex-col items-center justify-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.12em] transition ${
      isActive ? 'text-white before:absolute before:top-0 before:h-[2px] before:w-6 before:bg-neon' : 'text-muted'
    }`
  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-void/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid h-16 grid-cols-5">
        <NavLink to="/feed" className={item}>
          <Radio className="h-5 w-5" strokeWidth={1.75} />
          Feed
        </NavLink>
        <NavLink to="/for-you" className={item}>
          <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          For you
        </NavLink>
        <NavLink to="/log" className="flex items-center justify-center" aria-label="Log a film">
          {({ isActive }) => (
            <span
              className={`flex h-11 w-14 items-center justify-center text-void transition active:scale-95 ${isActive ? 'bg-white' : 'bg-neon'}`}
              style={{ clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)' }}
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </span>
          )}
        </NavLink>
        <NavLink to="/watchlist" className={item}>
          <ListVideo className="h-5 w-5" strokeWidth={1.75} />
          List
        </NavLink>
        <NavLink to={user ? `/u/${user.username}` : '/login'} className={item}>
          {user ? <Avatar user={user} size={22} /> : <UserRound className="h-5 w-5" strokeWidth={1.75} />}
          {user ? 'Me' : 'Sign in'}
        </NavLink>
      </div>
    </nav>
  )
}
