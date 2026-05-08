import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useWorkoutLogs from '../hooks/useWorkoutLogs'
import useStreak from '../hooks/useStreak'

export default function Profile() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { logs } = useWorkoutLogs()
  const { currentStreak, totalWorkouts, thisWeekCount } = useStreak(logs)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const athleteName = user?.email ? user.email.split('@')[0] : '—'
  const initials = (user?.email || '?').slice(0, 2).toUpperCase()

  let memberSince = '—'
  if (user?.created_at) {
    try {
      memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } catch {
      memberSince = '—'
    }
  }

  const SECTION_LABEL_STYLE = {
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#64748B',
    borderLeft: '2px solid #14B8A6',
    paddingLeft: 8,
    marginBottom: 16,
    display: 'block',
  }

  const CARD_STYLE = {
    marginLeft: 20,
    marginRight: 20,
    marginTop: 16,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    border: '1px solid rgba(255,255,255,0.06)',
  }

  const STAT_ROW_STYLE = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
  }

  const weekProgress = Math.min(thisWeekCount / 7, 1)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Header */}
      <div
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 48,
          paddingBottom: 20,
          borderBottom: '2px solid #14B8A6',
          backgroundColor: '#0F172A',
        }}
      >
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 36,
            color: '#F8FAFC',
            margin: 0,
          }}
        >
          Profile
        </h1>
      </div>

      {/* ACCOUNT CARD */}
      <div style={CARD_STYLE}>
        {/* Avatar */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#134E4A',
            border: '2px solid #14B8A6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: '#14B8A6',
            }}
          >
            {initials}
          </span>
        </div>

        {/* Athlete name */}
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600,
            fontSize: 18,
            color: '#F8FAFC',
            marginTop: 12,
            marginBottom: 0,
          }}
        >
          {athleteName}
        </p>

        {/* Email */}
        <p
          style={{
            fontSize: 14,
            color: '#94A3B8',
            marginTop: 2,
            marginBottom: 0,
          }}
        >
          {user?.email}
        </p>
      </div>

      {/* STATS CARD */}
      <div style={CARD_STYLE}>
        <span style={SECTION_LABEL_STYLE}>YOUR STATS</span>

        <div style={{ borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
          <div style={STAT_ROW_STYLE}>
            <span style={{ fontSize: 14, color: '#94A3B8' }}>Total Workouts</span>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                color: '#F8FAFC',
              }}
            >
              {totalWorkouts}
            </span>
          </div>
        </div>

        <div style={{ borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
          <div style={STAT_ROW_STYLE}>
            <span style={{ fontSize: 14, color: '#94A3B8' }}>Current Streak</span>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                color: '#F8FAFC',
              }}
            >
              {currentStreak} day{currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div style={STAT_ROW_STYLE}>
          <span style={{ fontSize: 14, color: '#94A3B8' }}>Member Since</span>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              color: '#F8FAFC',
            }}
          >
            {memberSince}
          </span>
        </div>
      </div>

      {/* PLAN CARD */}
      <div style={CARD_STYLE}>
        <span style={SECTION_LABEL_STYLE}>CURRENT PLAN</span>

        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: '#F8FAFC',
            margin: 0,
          }}
        >
          StrongBase Week 1
        </p>
        <p
          style={{
            fontSize: 14,
            color: '#94A3B8',
            marginTop: 2,
            marginBottom: 0,
          }}
        >
          7-day home workout program
        </p>

        {/* Progress bar */}
        <div
          style={{
            marginTop: 12,
            height: 6,
            backgroundColor: '#334155',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${weekProgress * 100}%`,
              backgroundColor: '#14B8A6',
              borderRadius: 999,
              transition: 'width 0.6s ease',
            }}
          />
        </div>
        <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
          {thisWeekCount} of 7 days this week
        </p>
      </div>

      {/* SIGN OUT BUTTON */}
      <div style={{ marginLeft: 20, marginRight: 20, marginTop: 24, paddingBottom: 100 }}>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            height: 48,
            backgroundColor: '#1E293B',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#94A3B8',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
