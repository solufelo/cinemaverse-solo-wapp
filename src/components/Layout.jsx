import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Database, Hourglass } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import Navbar from './Navbar'

export default function Layout() {
  const { user } = useAuth()
  const health = useApi('/health')

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-neon focus:px-3 focus:py-2 focus:text-void">
        Skip to content
      </a>
      <Navbar />
      {health.data?.sandbox ? (
        <Notice icon={Database}>
          Sandbox mode: no database is configured, so this server keeps data in memory. Demo data is real; your changes reset when the server restarts.
        </Notice>
      ) : null}
      {user?.kind === 'guest' ? (
        <Notice icon={Hourglass}>Guest account: your log is public on the feed and is deleted after 24 hours.</Notice>
      ) : null}
      <div id="main" className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

function Notice({ icon: Icon, children }) {
  return (
    <div className="border-b border-acid/20 bg-acid/[0.06]">
      <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2 text-sm text-acid/90">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        {children}
      </p>
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-white/[0.07]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Film data and images from{' '}
          <a href="https://www.themoviedb.org/" className="text-slate-300 underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <p className="shrink-0">
          Built by Solomon Olufelo ·{' '}
          <a href="https://github.com/solufelo/CinemaVerse" className="text-slate-300 underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
            Source
          </a>
        </p>
      </div>
    </footer>
  )
}

/** Route guard: bounce signed-out visitors to sign in, then back. */
export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="mx-auto max-w-6xl px-4 py-16" aria-busy="true" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return children
}
