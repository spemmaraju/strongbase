import { useLocation, useNavigate } from 'react-router-dom'
import useMediaQuery from '../hooks/useMediaQuery'
import { Icon } from './Icons'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  rail:    '#0c1322',
  inset:   '#16233a',
  border:  'rgba(255,255,255,0.06)',
  grad:    'linear-gradient(135deg, #ec4899, #8b5cf6)',
  violet:  '#c084fc',
  dim:     '#475569',
  subtle:  '#64748b',
}

const TABS = [
  { path: '/',        iconName: 'home',    label: 'Home'    },
  { path: '/history', iconName: 'clock',   label: 'History' },
  { path: '/profile', iconName: 'badge',   label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const isWide = useMediaQuery('(min-width: 768px)')

  if (isWide) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 80,
        backgroundColor: K.rail,
        borderRight: `1px solid ${K.border}`,
        zIndex: 50,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 16, gap: 8,
      }}>
        {/* S monogram */}
        <div style={{
          width: 46, height: 46, borderRadius: 14, marginBottom: 12,
          background: K.grad,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT, fontWeight: 800, fontSize: 22, color: '#fff',
          flexShrink: 0, cursor: 'pointer',
        }} onClick={() => navigate('/')}>S</div>

        {TABS.map(({ path, iconName, label }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={label}
              style={{
                width: 52, height: 52, borderRadius: 14,
                backgroundColor: active ? 'rgba(168,85,247,0.14)' : 'transparent',
                border: active ? '1px solid rgba(168,85,247,0.28)' : '1px solid transparent',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3,
                color: active ? K.violet : K.dim,
                transition: 'all 0.15s',
              }}
              aria-label={label}
            >
              <Icon name={iconName} size={20} />
              <span style={{
                fontFamily: MONO, fontSize: 8, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: active ? K.violet : K.dim,
              }}>{label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // ── Narrow: fixed bottom bar ───────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      backgroundColor: K.rail,
      borderTop: `1px solid ${K.border}`,
      display: 'flex', zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {TABS.map(({ path, iconName, label }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1, minHeight: 62,
              background: 'none', border: 'none',
              borderTop: `2px solid ${active ? K.violet : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, paddingTop: 8, paddingBottom: 6,
              color: active ? K.violet : K.dim,
              transition: 'color 0.15s',
            }}
            aria-label={label}
          >
            <Icon name={iconName} size={22} />
            <span style={{
              fontSize: 10, fontWeight: active ? 700 : 600,
              letterSpacing: '0.03em',
              color: active ? K.violet : K.subtle,
            }}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
