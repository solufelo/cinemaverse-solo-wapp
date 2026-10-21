import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { CATALOG } from '../../shared/catalog.ts'
import { DemoButton } from '../components/Navbar'
import { Poster } from '../components/ui'
import { useAuth } from '../context/AuthContext'

function AuthShell({ title, subtitle, children, footer }) {
  const wall = CATALOG.filter((f) => f.posterPath).slice(0, 12)
  return (
    <main className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:min-h-[78vh] lg:grid-cols-2">
      <div aria-hidden="true" className="relative hidden h-[560px] overflow-hidden rounded-3xl border border-white/[0.07] lg:block">
        <div className="grid -rotate-6 scale-110 grid-cols-4 gap-3 p-4 opacity-60">
          {wall.map((f) => (
            <Poster key={f.tmdbId} path={f.posterPath} title="" size="w185" className="w-full rounded-lg" />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-void via-void/70 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8">
          <p className="eyebrow">CinemaVerse</p>
          <p className="mt-2 font-display text-2xl font-black uppercase leading-tight text-white">
            Your film log.
            <br />
            <span className="text-neon">Your squad&apos;s feed.</span>
          </p>
        </div>
      </div>

      <div className="panel glow-border mx-auto w-full max-w-md p-7 sm:p-8">
        <h1 className="font-display text-3xl font-bold uppercase text-white">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
        {children}
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted">
          <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
        </div>
        <DemoButton className="btn-quiet w-full">Try the demo without an account</DemoButton>
        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
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
      <input id={id} className={`input-field ${error ? 'border-ember/60' : ''}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} {...props} />
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
          <Link to="/signup" state={location.state} className="text-neon hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form className="mt-7 space-y-4" onSubmit={submit} noValidate>
        <Field id="identifier" label="Email or username" autoComplete="username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} error={state.fields.identifier} />
        <Field id="password" label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={state.fields.password} />
        {state.error && !Object.keys(state.fields).length ? (
          <p role="alert" className="rounded-lg border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={state.submitting} className="btn-primary w-full py-3">
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
          <Link to="/login" state={location.state} className="text-neon hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="mt-7 space-y-4" onSubmit={submit} noValidate>
        <Field id="username" label="Username" autoComplete="username" required minLength={3} maxLength={20} value={form.username} onChange={set('username')} error={state.fields.username} placeholder="letters, numbers, _ or ." />
        <Field id="email" label="Email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} error={state.fields.email} />
        <Field id="new-password" label="Password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} error={state.fields.password} placeholder="8+ characters" />
        {state.error && !Object.keys(state.fields).length ? (
          <p role="alert" className="rounded-lg border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={state.submitting} className="btn-primary w-full py-3">
          {state.submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {state.submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
