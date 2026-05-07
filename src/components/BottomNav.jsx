import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/',        icon: '🏠', label: 'Home'    },
  { path: '/history', icon: '📅', label: 'History' },
  { path: '/profile', icon: '👤', label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#0F172A',
        borderTop: '1px solid #1E293B',
        display: 'flex',
        zIndex: 50,
        // Safe area inset for iPhones with home bar
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {TABS.map(tab => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center justify-center transition-all active:scale-90"
            style={{
              minHeight: 64,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              gap: 3,
            }}
            aria-label={tab.label}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: active ? '#14B8A6' : '#475569',
                transition: 'color 0.15s',
              }}
            >
              {tab.label.toUpperCase()}
            </span>
            {active && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: 32,
                  height: 2,
                  backgroundColor: '#14B8A6',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
