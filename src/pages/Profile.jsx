import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useWorkoutLogs from '../hooks/useWorkoutLogs'
import useStreak from '../hooks/useStreak'
import useMediaQuery from '../hooks/useMediaQuery'
import { Icon } from '../components/Icons'
import { getTopMuscles, formatDuration } from '../utils/workoutStats'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  bg:      '#0a0e1a',
  card:    '#101828',
  inset:   '#16233a',
  border:  'rgba(255,255,255,0.06)',
  borderSt:'rgba(255,255,255,0.10)',
  pink:    '#ec4899',
  purple:  '#8b5cf6',
  violet:  '#c084fc',
  grad:    'linear-gradient(90deg, #ec4899, #8b5cf6)',
  gradD:   'linear-gradient(135deg, #ec4899, #8b5cf6)',
  amber:   '#f59e0b',
  teal:    '#2dd4bf',
  text:    '#f8fafc',
  muted:   '#94a3b8',
  subtle:  '#64748b',
  dim:     '#475569',
}

// Level system — mirrors Home.jsx
const LEVEL_THRESHOLDS = [0, 400, 900, 1800, 3200, 5000, 7500, 11000, 15500, 21000]
const LEVEL_NAMES      = ['Starter', 'Active', 'Regular', 'Consistent', 'Dedicated', 'Athlete', 'Beast', 'Warrior', 'Legend', 'Champion']

function getLevelInfo(totalXP) {
  let idx = 0
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) idx = i
    else break
  }
  const level    = idx + 1
  const floor    = LEVEL_THRESHOLDS[idx]
  const ceiling  = LEVEL_THRESHOLDS[Math.min(idx + 1, LEVEL_THRESHOLDS.length - 1)]
  const progress = ceiling > floor ? (totalXP - floor) / (ceiling - floor) : 1
  const xpToNext = Math.max(0, ceiling - totalXP)
  return { level, name: LEVEL_NAMES[idx] || 'Champion', progress: Math.min(progress, 1), totalXP, xpToNext }
}

// ── Stat row helper ──────────────────────────────────────────────────────────

function StatRow({ label, value, icon, accent, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 0',
      borderBottom: last ? 'none' : `1px solid ${K.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: K.inset, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={14} style={{ color: accent || K.violet }} />
        </div>
        <span style={{ fontSize: 14, color: K.muted }}>{label}</span>
      </div>
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: K.text }}>{value}</span>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const isWide   = useMediaQuery('(min-width: 768px)')
  const { user, signOut } = useAuth()
  const { logs } = useWorkoutLogs()
  const { currentStreak, longestStreak, totalWorkouts, thisWeekCount } = useStreak(logs)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || null
  const athleteName = displayName || 'Athlete'
  const initials    = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : (user?.email || '?').slice(0, 2).toUpperCase()

  let memberSince = '—'
  if (user?.created_at) {
    try { memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
    catch {}
  }

  const allCompletedIds = logs.flatMap(l => l.completedExerciseIds || [])
  const topMuscles      = getTopMuscles(allCompletedIds, 8)
  const totalTimeSeconds = logs.reduce((sum, l) => sum + (l.totalTimeSeconds || 0), 0)
  const weekProgress    = Math.min(thisWeekCount / 7, 1)
  const totalXP         = logs.reduce((sum, l) => sum + (l.totalSets || 0) * 25, 0)
  const levelInfo       = getLevelInfo(totalXP)

  const CARD = { backgroundColor: K.card, borderRadius: 18, border: `1px solid ${K.borderSt}`, padding: 20 }

  // ── Wide: two-column ──────────────────────────────────────────────────────
  if (isWide) {
    return (
      <div style={{ backgroundColor: K.bg, minHeight: '100svh', color: K.text }}>
        {/* Header */}
        <div style={{ padding: '32px 28px 24px', borderBottom: `1px solid ${K.border}` }}>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: K.text, margin: 0 }}>Profile</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 28, padding: '28px 28px 48px', alignItems: 'start' }}>

          {/* Left: identity + level */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Avatar card */}
            <div style={{ ...CARD, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: K.gradD,
                border: '3px solid rgba(192,132,252,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#fff' }}>{initials}</span>
              </div>
              <div>
                <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: K.text, margin: 0 }}>{athleteName}</p>
                <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim, letterSpacing: '0.08em', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{user?.email}</p>
                <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.08em', margin: '3px 0 0' }}>SINCE {memberSince.toUpperCase()}</p>
              </div>
            </div>

            {/* Level card */}
            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="xp" size={16} style={{ color: K.violet }} />
                  <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: K.text }}>
                    Level {levelInfo.level} · {levelInfo.name}
                  </span>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.violet }}>{levelInfo.totalXP} XP</span>
              </div>
              <div style={{ height: 5, borderRadius: 999, backgroundColor: K.inset, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round(levelInfo.progress * 100)}%`, background: K.gradD, borderRadius: 999, transition: 'width 0.6s ease' }} />
              </div>
              {levelInfo.xpToNext > 0 && (
                <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.08em', marginTop: 7 }}>
                  {levelInfo.xpToNext} XP to level {levelInfo.level + 1}
                </p>
              )}
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              style={{
                width: '100%', minHeight: 48, backgroundColor: K.inset,
                borderRadius: 14, border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5', fontSize: 13, fontWeight: 700,
                fontFamily: FONT, cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = K.inset}
            >
              Sign Out
            </button>
          </div>

          {/* Right: stats + muscles + plan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Stats */}
            <div style={CARD}>
              <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Your Stats</p>
              <StatRow label="Total Workouts"   value={totalWorkouts}                         icon="trophy" />
              <StatRow label="Current Streak"   value={`${currentStreak} day${currentStreak !== 1 ? 's' : ''}`} icon="streak" accent={K.amber} />
              <StatRow label="Longest Streak"   value={`${longestStreak} day${longestStreak !== 1 ? 's' : ''}`} icon="badge" />
              <StatRow label="Total Time Trained" value={formatDuration(totalTimeSeconds)}    icon="clock"  last />
            </div>

            {/* Muscles */}
            {topMuscles.length > 0 && (
              <div style={CARD}>
                <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Muscles Worked</p>
                <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim, letterSpacing: '0.06em', marginBottom: 14 }}>
                  Based on {logs.length} workout{logs.length !== 1 ? 's' : ''}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {topMuscles.map((muscle, i) => (
                    <span key={muscle} style={{
                      padding: '5px 12px', borderRadius: 999,
                      fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                      backgroundColor: i < 3 ? 'rgba(139,92,246,0.12)' : K.inset,
                      color: i < 3 ? K.violet : K.subtle,
                      border: `1px solid ${i < 3 ? 'rgba(139,92,246,0.28)' : K.border}`,
                    }}>{muscle}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Current plan */}
            <div style={CARD}>
              <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Current Plan</p>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: K.text, margin: 0 }}>StrongBase Week 1</p>
              <p style={{ fontSize: 13, color: K.muted, marginTop: 2, marginBottom: 14 }}>7-day home workout program</p>
              <div style={{ height: 5, backgroundColor: K.inset, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${weekProgress * 100}%`, background: K.gradD, borderRadius: 999, transition: 'width 0.6s ease' }} />
              </div>
              <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim, letterSpacing: '0.06em', marginTop: 7 }}>
                {thisWeekCount} OF 7 DAYS THIS WEEK
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Narrow: single column ────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: K.bg, minHeight: '100svh', color: K.text }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 20px', borderBottom: `1px solid ${K.border}` }}>
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: K.text, margin: 0 }}>Profile</h1>
      </div>

      <div style={{ padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Avatar card */}
        <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: K.gradD, border: '2.5px solid rgba(192,132,252,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: '#fff' }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: K.text, margin: 0 }}>{athleteName}</p>
            <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim, letterSpacing: '0.06em', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.06em', margin: '2px 0 0' }}>SINCE {memberSince.toUpperCase()}</p>
          </div>
        </div>

        {/* Level card */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="xp" size={14} style={{ color: K.violet }} />
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: K.text }}>
                Level {levelInfo.level} · {levelInfo.name}
              </span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.violet }}>{levelInfo.totalXP} XP</span>
          </div>
          <div style={{ height: 5, borderRadius: 999, backgroundColor: K.inset, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round(levelInfo.progress * 100)}%`, background: K.gradD, borderRadius: 999 }} />
          </div>
          {levelInfo.xpToNext > 0 && (
            <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.08em', marginTop: 6 }}>
              {levelInfo.xpToNext} XP to level {levelInfo.level + 1}
            </p>
          )}
        </div>

        {/* Stats */}
        <div style={CARD}>
          <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Your Stats</p>
          <StatRow label="Total Workouts"     value={totalWorkouts}                           icon="trophy" />
          <StatRow label="Current Streak"     value={`${currentStreak} day${currentStreak !== 1 ? 's' : ''}`} icon="streak" accent={K.amber} />
          <StatRow label="Longest Streak"     value={`${longestStreak} day${longestStreak !== 1 ? 's' : ''}`} icon="badge" />
          <StatRow label="Total Time Trained" value={formatDuration(totalTimeSeconds)}        icon="clock"  last />
        </div>

        {/* Muscles */}
        {topMuscles.length > 0 && (
          <div style={CARD}>
            <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Muscles Worked</p>
            <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim, letterSpacing: '0.06em', marginBottom: 12 }}>
              Based on {logs.length} workout{logs.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {topMuscles.map((muscle, i) => (
                <span key={muscle} style={{
                  padding: '5px 11px', borderRadius: 999,
                  fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  backgroundColor: i < 3 ? 'rgba(139,92,246,0.12)' : K.inset,
                  color: i < 3 ? K.violet : K.subtle,
                  border: `1px solid ${i < 3 ? 'rgba(139,92,246,0.28)' : K.border}`,
                }}>{muscle}</span>
              ))}
            </div>
          </div>
        )}

        {/* Current plan */}
        <div style={CARD}>
          <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Current Plan</p>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: K.text, margin: 0 }}>StrongBase Week 1</p>
          <p style={{ fontSize: 13, color: K.muted, marginTop: 2, marginBottom: 12 }}>7-day home workout program</p>
          <div style={{ height: 5, backgroundColor: K.inset, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${weekProgress * 100}%`, background: K.gradD, borderRadius: 999 }} />
          </div>
          <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim, letterSpacing: '0.06em', marginTop: 6 }}>
            {thisWeekCount} OF 7 DAYS THIS WEEK
          </p>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', minHeight: 52, marginTop: 6,
            backgroundColor: K.inset, borderRadius: 16,
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5', fontSize: 14, fontWeight: 700,
            fontFamily: FONT, cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = K.inset}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
