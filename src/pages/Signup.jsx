import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { Icon } from '../components/Icons'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"
const K = {
  bg: '#0a0e1a', card: '#101828', inset: '#16233a',
  border: 'rgba(255,255,255,0.08)', borderSt: 'rgba(255,255,255,0.14)',
  violet: '#c084fc', grad: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
  text: '#f8fafc', muted: '#94a3b8', dim: '#64748b',
}

export default function Signup() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error,           setError]           = useState('')
  const [success,         setSuccess]         = useState(false)
  const [loading,         setLoading]         = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    const { error: err } = await signUp(email, password)
    setLoading(false)
    if (err) setError(err.message || 'Something went wrong. Please try again.')
    else setSuccess(true)
  }

  if (success) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', backgroundColor: K.bg }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: K.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#fff' }}>
          <Icon name="check" size={32} strokeWidth={2} />
        </div>
        <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: K.text, marginBottom: 10 }}>Check your email</h2>
        <p style={{ fontSize: 15, color: K.muted, maxWidth: 320, marginBottom: 28 }}>
          We sent a confirmation link to <strong style={{ color: K.text }}>{email}</strong>. Click it to activate your account.
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{ minHeight: 52, background: K.grad, color: '#fff', border: 'none', borderRadius: 14, fontFamily: FONT, fontWeight: 700, fontSize: 15, padding: '0 32px', cursor: 'pointer' }}
        >
          Go to Sign In
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', backgroundColor: K.bg }}>

      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: K.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#fff' }}>
          <Icon name="strength" size={32} strokeWidth={1.5} />
        </div>
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: K.text, margin: 0 }}>StrongBase</h1>
        <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: K.dim, letterSpacing: '0.1em', marginTop: 5 }}>
          BUILD THE HABIT. OWN THE WEEK.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ backgroundColor: K.card, border: `1px solid ${K.borderSt}`, borderRadius: 22, padding: 24, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: K.text, margin: 0 }}>Create Account</h2>

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {[
          { label: 'Email',            hint: '',                       type: 'email',    value: email,           onChange: setEmail,           autoComplete: 'email',        placeholder: 'you@example.com' },
          { label: 'Password',         hint: '(min 8 characters)',     type: 'password', value: password,        onChange: setPassword,        autoComplete: 'new-password', placeholder: '••••••••' },
          { label: 'Confirm Password', hint: '',                       type: 'password', value: confirmPassword, onChange: setConfirmPassword, autoComplete: 'new-password', placeholder: '••••••••' },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {f.label}{f.hint && <span style={{ color: K.dim, fontWeight: 400, textTransform: 'none', fontSize: 10 }}> {f.hint}</span>}
            </label>
            <input
              type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)}
              required autoComplete={f.autoComplete} placeholder={f.placeholder}
              style={{ minHeight: 50, backgroundColor: K.inset, border: `1px solid ${K.border}`, borderRadius: 12, padding: '0 14px', color: K.text, fontSize: 15, fontWeight: 500, outline: 'none', caretColor: K.violet }}
              onFocus={e => e.target.style.borderColor = K.violet}
              onBlur={e => e.target.style.borderColor = K.border}
            />
          </div>
        ))}

        <button
          type="submit" disabled={loading}
          style={{ minHeight: 52, background: loading ? K.inset : K.grad, color: '#fff', border: 'none', borderRadius: 14, fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 14, color: K.dim }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: K.violet, fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
      </p>
    </div>
  )
}
