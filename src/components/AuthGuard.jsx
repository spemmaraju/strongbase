import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

// Animated teal spinner shown while the session is being checked
function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: '#0F172A' }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '4px solid #334155',
          borderTopColor: '#14B8A6',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p className="text-sm font-semibold" style={{ color: '#64748B' }}>Loading…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  if (!user) {
    // Remember where the user was trying to go
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
