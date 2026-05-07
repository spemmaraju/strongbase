import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Profile() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: 'linear-gradient(180deg, #0D9488 0%, #0F172A 100%)' }}
      >
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Profile</h1>
        <p className="mt-1 text-base font-medium" style={{ color: '#99F6E4' }}>
          Your account
        </p>
      </div>

      <div className="px-5 space-y-4">
        {/* Account card */}
        <section
          className="rounded-xl p-5"
          style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
        >
          <div
            className="flex items-center justify-center rounded-full mx-auto mb-4"
            style={{
              width: 64, height: 64,
              backgroundColor: '#14B8A620',
              border: '2px solid #14B8A660',
            }}
          >
            <span className="text-2xl font-extrabold" style={{ color: '#14B8A6' }}>
              {(user?.email || '?').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <p className="text-center text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#64748B' }}>
            Signed in as
          </p>
          <p className="text-center text-base font-bold text-white break-all">
            {user?.email}
          </p>
        </section>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full rounded-xl font-bold text-base transition-all active:scale-95"
          style={{
            minHeight: 56,
            backgroundColor: '#EF444420',
            color: '#FCA5A5',
            border: '1px solid #EF444440',
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EF444430'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EF444420'}
        >
          Sign Out
        </button>

        <p className="text-center text-xs mt-2" style={{ color: '#334155' }}>
          More profile settings coming soon
        </p>
      </div>
    </div>
  )
}
