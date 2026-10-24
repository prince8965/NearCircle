import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Logo } from '../components/layout/Logo'
import { DemoNote } from '../components/ui/DemoNote'
import { FormField } from '../components/ui/FormField'
import { useAuth } from '../hooks/AuthContext'
import { useToast } from '../hooks/ToastContext'

interface Props {
  mode: 'login' | 'signup'
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Errors {
  name?: string
  email?: string
  password?: string
  confirm?: string
  form?: string
}

export default function AuthPage({ mode }: Props) {
  const isSignup = mode === 'signup'
  const { signIn, signUp } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  const validate = (): Errors => {
    const e: Errors = {}
    if (isSignup && name.trim().length < 2) e.name = 'Enter your name.'
    if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address.'
    if (password.length < 8) e.password = 'Use at least 8 characters.'
    if (isSignup && confirm !== password) e.confirm = 'Passwords don’t match.'
    return e
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.getElementById(`auth-${Object.keys(found)[0]}`)?.focus())
      return
    }
    setBusy(true)
    try {
      if (isSignup) await signUp(name.trim(), email.trim(), password)
      else await signIn(email.trim(), password)
      notify(isSignup ? 'Welcome to NearCircle! (demo session)' : 'Welcome back! (demo session)')
      navigate(from, { replace: true })
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Something went wrong. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="hidden lg:block">
        <Logo className="mb-6" />
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">Find your people, nearby.</h1>
        <p className="mt-4 max-w-md text-lg text-ink-muted">
          Join to RSVP to events, follow communities and host your own meetups.
        </p>
        <div className="mt-8 max-w-md rounded-2xl bg-secondary border border-[#334155]/60 p-5 text-sm text-ink-muted">
          Workshops, hackathons, open mics and more — all within a short ride of campus.
        </div>
      </div>

      <div className="card mx-auto w-full max-w-md space-y-5 p-6 sm:p-8">
        <div>
          <h2 className="text-2xl font-bold text-white">{isSignup ? 'Create your account' : 'Welcome back'}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {isSignup ? 'Join NearCircle in a few seconds.' : 'Log in to see your events.'}
          </p>
        </div>

        <DemoNote>
          Demo sign-in only. No real account is created, and your password is never stored or checked. The auth layer is
          designed to be swapped for Supabase Auth.
        </DemoNote>

        <form onSubmit={submit} noValidate className="space-y-4">
          {isSignup && (
            <FormField id="auth-name" label="Full name" required error={errors.name}>
              <input id="auth-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
            </FormField>
          )}
          <FormField id="auth-email" label="Email" required error={errors.email}>
            <input id="auth-email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
          </FormField>
          <FormField id="auth-password" label="Password" required error={errors.password} hint="At least 8 characters.">
            <div className="relative">
              <input
                id="auth-password"
                type={show ? 'text' : 'password'}
                className="input pr-11"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-faint hover:text-white"
                aria-label={show ? 'Hide password' : 'Show password'}
                aria-pressed={show}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>
          {isSignup && (
            <FormField id="auth-confirm" label="Confirm password" required error={errors.confirm}>
              <input id="auth-confirm" type={show ? 'text' : 'password'} className="input" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={!!errors.confirm} />
            </FormField>
          )}

          {errors.form && (
            <p role="alert" className="rounded-lg bg-rose-950/40 border border-rose-500/30 px-3 py-2 text-sm font-medium text-rose-300">
              {errors.form}
            </p>
          )}

          <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin text-[#0B0F19]" aria-hidden />}
            {isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted">
          {isSignup ? 'Already have an account?' : 'New to NearCircle?'}{' '}
          <Link to={isSignup ? '/login' : '/signup'} state={location.state} className="font-semibold text-brand hover:underline">
            {isSignup ? 'Log in' : 'Sign up'}
          </Link>
        </p>
      </div>
    </div>
  )
}
