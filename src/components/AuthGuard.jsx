import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

// Animated teal spinner shown while the session is being checked
function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: '#0a0e1a' }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '4px solid rgba(255,255,255,0.08)',
          borderTopColor: '#c084fc',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p className="text-sm font-semibold" style={{ color: '#64748B' }}>Loading…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// skipOnboardingCheck: set on the /onboarding route itself to avoid redirect loop
export default function AuthGuard({ children, skipOnboardingCheck = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const localFallback = localStorage.getItem('strongbase_onboarding_complete') === 'true'
  if (!skipOnboardingCheck && !user.user_metadata?.onboardingComplete && !localFallback) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
