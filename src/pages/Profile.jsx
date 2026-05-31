import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useWorkoutLogs from '../hooks/useWorkoutLogs'
import useStreak from '../hooks/useStreak'
import { getTopMuscles, formatDuration } from '../utils/workoutStats'

export default function Profile() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { logs } = useWorkoutLogs()
  const { currentStreak, totalWorkouts, thisWeekCount } = useStreak(logs)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const displayName = user?.user_metadata?.display_name
    || user?.user_metadata?.full_name
    || null
  const athleteName = displayName || 'Athlete'
  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : (user?.email || '?').slice(0, 2).toUpperCase()

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

  // Muscles worked + total time — derived from logs
  const allCompletedIds = logs.flatMap(l => l.completedExerciseIds || [])
  const topMuscles = getTopMuscles(allCompletedIds, 8)
  const totalTimeSeconds = logs.reduce((sum, l) => sum + (l.totalTimeSeconds || 0), 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Header — compact */}
      <div style={{ padding: '44px 20px 16px', borderBottom: '1px solid rgba(51,65,85,0.4)', backgroundColor: '#0F172A' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 24, color: '#F8FAFC', margin: 0 }}>
          Profile
        </h1>
      </div>

      {/* ACCOUNT CARD — horizontal */}
      <div style={{ ...CARD_STYLE, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          backgroundColor: '#134E4A', border: '2px solid #14B8A6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: '#14B8A6' }}>
            {initials}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#F8FAFC', margin: 0 }}>
            {athleteName}
          </p>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </p>
          <p style={{ fontSize: 12, color: '#475569', margin: 0, marginTop: 3 }}>
            Member since {memberSince}
          </p>
        </div>
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

        <div style={{ borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
          <div style={STAT_ROW_STYLE}>
            <span style={{ fontSize: 14, color: '#94A3B8' }}>Total Time Trained</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 14, color: '#F8FAFC' }}>
              {formatDuration(totalTimeSeconds)}
            </span>
          </div>
        </div>

      </div>

      {/* MUSCLES WORKED CARD */}
      {topMuscles.length > 0 && (
        <div style={CARD_STYLE}>
          <span style={SECTION_LABEL_STYLE}>MUSCLES WORKED</span>
          <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
            Based on your {logs.length} completed workout{logs.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {topMuscles.map((muscle, i) => (
              <span
                key={muscle}
                style={{
                  paddingLeft: 12, paddingRight: 12,
                  paddingTop: 6, paddingBottom: 6,
                  borderRadius: 999,
                  fontSize: 12, fontWeight: 600,
                  backgroundColor: i < 3 ? '#134E4A' : '#1E293B',
                  color: i < 3 ? '#2DD4BF' : '#64748B',
                  border: `1px solid ${i < 3 ? '#14B8A640' : '#33415540'}`,
                }}
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>
      )}

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
            minHeight: 52,
            backgroundColor: '#1E293B',
            borderRadius: 16,
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#FCA5A5',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EF444415'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1E293B'}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
