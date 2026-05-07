import { useLocation, useNavigate } from 'react-router-dom'

// Inline SVG icons — clean outlines, 24×24px
function HomeIcon({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function HistoryIcon({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="14" x2="12" y2="14" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="14" x2="16" y2="14" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8" y1="18" x2="8" y2="18" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function ProfileIcon({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

const TABS = [
  { path: '/',        Icon: HomeIcon,    label: 'Home'    },
  { path: '/history', Icon: HistoryIcon, label: 'History' },
  { path: '/profile', Icon: ProfileIcon, label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#1E293B',
        borderTop: '1px solid rgba(51,65,85,0.5)',
        display: 'flex',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {TABS.map(({ path, Icon, label }) => {
        const active = location.pathname === path
        const color = active ? '#14B8A6' : '#64748B'
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex-1 flex flex-col items-center justify-center transition-all active:scale-90"
            style={{
              minHeight: 64,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              paddingTop: 10,
              paddingBottom: 6,
              gap: 4,
              position: 'relative',
            }}
            aria-label={label}
          >
            <Icon color={color} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.03em',
                color,
                transition: 'color 0.15s',
              }}
            >
              {label}
            </span>
            {active && (
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: '#14B8A6',
                  marginTop: 2,
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
