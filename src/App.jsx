import { Link, Route, Routes } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Layout, { RequireAuth } from './components/Layout'
import { LoginPage, SignupPage } from './pages/AuthPages'
import FeedPage from './pages/FeedPage'
import ForYouPage from './pages/ForYouPage'
import HomePage from './pages/HomePage'
import LogPage from './pages/LogPage'
import ProfilePage, { MyProfileRedirect } from './pages/ProfilePage'
import WatchlistPage from './pages/WatchlistPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="u/:username" element={<ProfilePage />} />
        <Route path="profile" element={<MyProfileRedirect />} />
        <Route path="log" element={<RequireAuth><LogPage /></RequireAuth>} />
        <Route path="watchlist" element={<RequireAuth><WatchlistPage /></RequireAuth>} />
        <Route path="for-you" element={<RequireAuth><ForYouPage /></RequireAuth>} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

function NotFound() {
  return (
    <main className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="grid-bg absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(60%_60%_at_50%_45%,black,transparent)]" />
      <div className="frame flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center py-20 text-center">
        <p className="hud-label" style={{ '--mark': '#ff6b5b' }}>
          Error 404 <span className="text-slate-600">/</span> signal lost
        </p>
        <p
          aria-hidden="true"
          data-text="404"
          className="glitch outline-num mt-6 font-display font-black leading-[0.8] tracking-[-0.06em]"
          style={{ fontSize: 'clamp(8rem, 30vw, 22rem)' }}
        >
          404
        </p>
        <h1 className="t-h2 mt-8">This reel doesn&apos;t exist</h1>
        <p className="mt-4 max-w-md text-muted">The link is broken or the page was cut in the edit. Head back and pick something that is showing.</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="btn-primary">
            Back home
          </Link>
          <Link to="/feed" className="btn-ghost">
            Open the feed <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  )
}
