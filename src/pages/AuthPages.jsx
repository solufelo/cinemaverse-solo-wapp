import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { CATALOG } from '../../shared/catalog.ts'
import { DemoButton } from '../components/Navbar'
import { Poster } from '../components/ui'
import { useAuth } from '../context/AuthContext'

function AuthShell({ title, subtitle, children, footer }) {
  const wall = CATALOG.filter((f) => f.posterPath)
  const cols = [wall.slice(0, 6), wall.slice(6, 12), wall.slice(12, 18)]
  return (
    <main className="frame grid items-stretch gap-12 py-12 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-12 lg:py-16">
      <div aria-hidden="true" className="relative hidden overflow-hidden rounded-2xl border border-white/[0.07] lg:col-span-6 lg:block">
        <div className="absolute inset-0 grid grid-cols-3 gap-3 p-3 opacity-70">
          {cols.map((col, c) => (
            <div key={c} className="overflow-hidden">
              <div className={`flex flex-col gap-3 animate-marquee-y ${c === 1 ? '[animation-direction:reverse]' : ''}`} style={{ animationDuration: `${60 + c * 12}s` }}>
                {[...col, ...col].map((f, i) => (
                  <Poster key={`${f.tmdbId}-${i}`} path={f.posterPath} title="" size="w185" className="w-full rounded-[4px]" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="scanlines absolute inset-0 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-void/10" />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="hud-label">Cinemaverse</p>
          <p className="t-h1 mt-5 text-[clamp(2rem,1rem+2vw,3.2rem)]">
            Your film log.
            <br />
            <span className="text-neon">Your squad&apos;s feed.</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center lg:col-span-5 lg:col-start-8">
        <div className="mx-auto w-full max-w-md">
          <p className="hud-label">Player access</p>
          <h1 className="t-h1 mt-5">{title}</h1>
          <p className="mt-4 text-muted">{subtitle}</p>
          {children}
          <div className="my-8 flex items-center gap-4 font-mono text-[10.5px] uppercase tracking-[0.3em] text-muted">
            <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
          </div>
          <DemoButton className="btn-ghost w-full">Try the demo without an account</DemoButton>
          <p className="mt-8 text-center text-sm text-muted">{footer}</p>
        </div>
      </div>
    </main>
  )
}

function Field({ id, label, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input id={id} className={`input-field h-12 ${error ? 'border-ember/60' : ''}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-ember">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function useSubmit(fn) {
  const [state, setState] = useState({ submitting: false, error: null, fields: {} })
  const submit = async (e) => {
    e.preventDefault()
    setState({ submitting: true, error: null, fields: {} })
    try {
      await fn()
    } catch (err) {
      setState({ submitting: false, error: err.message, fields: err.fields || {} })
      return
    }
    setState((s) => ({ ...s, submitting: false }))
  }
  return [state, submit]
}

export function LoginPage() {
  const { user, signIn, loading } = useAuth()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [state, submit] = useSubmit(() => signIn({ identifier, password }))

  if (!loading && user) return <Navigate to={location.state?.from || '/feed'} replace />

  return (
    <AuthShell
      title="Sign in"
      subtitle="Back to the lobby. Your list is waiting."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" state={location.state} className="text-ink underline decoration-neon/60 underline-offset-4 transition hover:text-neon">
            Create an account
          </Link>
        </>
      }
    >
      <form className="mt-10 space-y-5" onSubmit={submit} noValidate>
        <Field id="identifier" label="Email or username" autoComplete="username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} error={state.fields.identifier} />
        <Field id="password" label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={state.fields.password} />
        {state.error && !Object.keys(state.fields).length ? (
          <p role="alert" className="border-l-2 border-ember bg-ember/10 px-3 py-2 text-sm text-ember">
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={state.submitting} className="btn-primary w-full">
          {state.submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {state.submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  )
}

export function SignupPage() {
  const { user, signUp, loading } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [state, submit] = useSubmit(() => signUp(form))
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  if (!loading && user) return <Navigate to={location.state?.from || '/log'} replace />

  return (
    <AuthShell
      title="Sign up"
      subtitle="Create your player profile and start logging films."
      footer={
        <>
          Already playing?{' '}
          <Link to="/login" state={location.state} className="text-ink underline decoration-neon/60 underline-offset-4 transition hover:text-neon">
            Sign in
          </Link>
        </>
      }
    >
      <form className="mt-10 space-y-5" onSubmit={submit} noValidate>
        <Field id="username" label="Username" autoComplete="username" required minLength={3} maxLength={20} value={form.username} onChange={set('username')} error={state.fields.username} placeholder="letters, numbers, _ or ." />
        <Field id="email" label="Email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} error={state.fields.email} />
        <Field id="new-password" label="Password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} error={state.fields.password} placeholder="8+ characters" />
        {state.error && !Object.keys(state.fields).length ? (
          <p role="alert" className="border-l-2 border-ember bg-ember/10 px-3 py-2 text-sm text-ember">
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={state.submitting} className="btn-primary w-full">
          {state.submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {state.submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
