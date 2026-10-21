import { Link, Route, Routes } from 'react-router-dom'
import { Ghost } from 'lucide-react'
import Layout, { RequireAuth } from './components/Layout'
import { EmptyState } from './components/ui'
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
        <Route
          path="*"
          element={
            <main className="mx-auto max-w-2xl px-4 py-20">
              <EmptyState icon={Ghost} title="Lost in the multiverse" action={<Link to="/" className="btn-primary">Back home</Link>}>
                That page doesn&apos;t exist.
              </EmptyState>
            </main>
          }
        />
      </Route>
    </Routes>
  )
}
