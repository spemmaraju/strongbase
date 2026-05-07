import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await signIn(email, password)
    setLoading(false)

    if (err) {
      setError('Invalid email or password. Please try again.')
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0F172A' }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">💪</div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">StrongBase</h1>
        <p className="text-sm mt-1 font-medium" style={{ color: '#94A3B8' }}>
          Build the habit. Own the week.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: '#1E293B', border: '1px solid #334155', maxWidth: 400 }}
      >
        <h2 className="text-xl font-bold text-white mb-2">Sign In</h2>

        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm font-medium"
            style={{ backgroundColor: '#EF444420', color: '#FCA5A5', border: '1px solid #EF444440' }}
          >
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-xl px-4 text-white text-base font-medium outline-none"
            style={{
              minHeight: 52,
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              caretColor: '#14B8A6',
            }}
            onFocus={e => e.target.style.borderColor = '#14B8A6'}
            onBlur={e => e.target.style.borderColor = '#334155'}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-xl px-4 text-white text-base font-medium outline-none"
            style={{
              minHeight: 52,
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              caretColor: '#14B8A6',
            }}
            onFocus={e => e.target.style.borderColor = '#14B8A6'}
            onBlur={e => e.target.style.borderColor = '#334155'}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl font-bold text-base text-white transition-all active:scale-95"
          style={{
            minHeight: 56,
            backgroundColor: loading ? '#0D9488' : '#14B8A6',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.8 : 1,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#0D9488' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#14B8A6' }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-sm" style={{ color: '#64748B' }}>
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="font-semibold"
          style={{ color: '#14B8A6', textDecoration: 'none' }}
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
