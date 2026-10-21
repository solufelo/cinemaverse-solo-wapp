import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getHealth } from '../lib/api'
import { startReveal } from '../lib/reveal'
import Navbar, { Mark, TabBar } from './Navbar'

export default function Layout() {
  const { user } = useAuth()
  const location = useLocation()
  const [sandbox, setSandbox] = useState(false)
  const mainRef = useRef(null)

  useEffect(() => {
    getHealth()
      .then((h) => setSandbox(Boolean(h?.sandbox)))
      .catch(() => {})
  }, [])

  useEffect(() => startReveal(mainRef.current), [])

  // New page: start at the top (the browser keeps its own position on back/forward).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-neon focus:px-3 focus:py-2 focus:font-mono focus:text-[12px] focus:uppercase focus:text-void"
      >
        Skip to content
      </a>
      <Navbar />
      <div key={`bar-${location.pathname}`} aria-hidden="true" className="route-bar pointer-events-none fixed inset-x-0 top-16 z-50 h-px bg-neon shadow-[0_0_10px_#00f5ff]" />
      <StatusStrip sandbox={sandbox} guest={user?.kind === 'guest'} />
      <div id="main" ref={mainRef} className="flex-1">
        <div key={location.pathname} className="route-in">
          <Outlet />
        </div>
      </div>
      <Footer />
      <TabBar />
    </div>
  )
}

/** One slim line for environment notices, instead of stacked banners. */
function StatusStrip({ sandbox, guest }) {
  if (!sandbox && !guest) return null
  return (
    <div className="border-b border-white/[0.06] bg-white/[0.02]">
      <div className="frame flex flex-wrap items-center gap-x-6 gap-y-1 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
        {guest ? (
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-plasma" aria-hidden="true" />
            <span>
              <span className="text-slate-200">Guest</span> · <span className="hidden sm:inline">your log is public and </span>expires in 24 h ·{' '}
              <Link to="/signup" className="text-neon underline-offset-4 hover:underline">
                Keep it
              </Link>
            </span>
          </p>
        ) : null}
        {sandbox ? (
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-acid" aria-hidden="true" />
            <span>
              <span className="text-slate-200">Sandbox</span> · no database configured, changes reset on restart
            </span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="pb-tabbar relative mt-28 overflow-hidden border-t border-white/[0.07] md:pb-0">
      <div className="frame grid gap-12 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link to="/" className="inline-flex items-center gap-2.5" aria-label="CinemaVerse home">
            <Mark className="h-7 w-7" />
            <span className="font-display text-sm font-extrabold uppercase tracking-[0.04em] text-white">
              Cinema<span className="text-neon">verse</span>
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-muted">A film log with a HUD. Log it, rate it, and the squad sees it.</p>
          <p className="mt-6 max-w-sm text-[13px] leading-relaxed text-slate-500">
            Film data and images from{' '}
            <a href="https://www.themoviedb.org/" className="text-slate-300 underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
              TMDB
            </a>
            . This product uses the TMDB API but is not endorsed or certified by TMDB. Demo players are fictional.
          </p>
        </div>
        <nav className="md:col-span-3 md:col-start-7" aria-label="Footer">
          <p className="hud-label mb-5">Navigate</p>
          <ul className="space-y-3">
            {[
              ['/feed', 'Squad feed'],
              ['/log', 'Log a film'],
              ['/watchlist', 'Watchlist'],
              ['/for-you', 'For you'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-slate-300 transition hover:text-neon">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-3">
          <p className="hud-label mb-5">Project</p>
          <ul className="space-y-3">
            <li>
              <a href="https://github.com/solufelo/CinemaVerse" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-300 transition hover:text-neon">
                Source on GitHub <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </li>
            <li className="text-slate-500">Built by Solomon Olufelo</li>
          </ul>
        </div>
      </div>
      <p
        aria-hidden="true"
        className="outline-num pointer-events-none select-none whitespace-nowrap text-center font-display font-black uppercase leading-[0.8] tracking-[-0.04em] opacity-30"
        style={{ fontSize: 'clamp(2.4rem, 10.2vw, 11rem)', marginBottom: '-0.1em' }}
      >
        Cinemaverse
      </p>
    </footer>
  )
}

/** Route guard: bounce signed-out visitors to sign in, then back. */
export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <HudLoader label="Checking session" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return children
}

export function HudLoader({ label = 'Loading' }) {
  return (
    <div className="frame flex min-h-[50vh] flex-col items-center justify-center gap-5" role="status" aria-live="polite">
      <Mark className="h-10 w-10 animate-pulse" />
      <span className="h-px w-28 overflow-hidden bg-white/10">
        <span className="block h-full w-1/3 animate-scan bg-neon" />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">{label}</span>
    </div>
  )
}
