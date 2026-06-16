import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getExercisesForLog, formatDuration, formatDateTime } from '../utils/workoutStats'
import { Icon } from '../components/Icons'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"
const K = {
  bg: '#0a0e1a', card: '#101828', inset: '#16233a',
  border: 'rgba(255,255,255,0.06)', borderSt: 'rgba(255,255,255,0.10)',
  violet: '#c084fc', pink: '#ec4899', purple: '#8b5cf6',
  grad: 'linear-gradient(90deg,#ec4899,#8b5cf6)',
  gradHero: 'linear-gradient(130deg,#fb923c 0%,#ec4899 48%,#8b5cf6 100%)',
  text: '#f8fafc', muted: '#94a3b8', dim: '#64748b',
}

function Stat({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: K.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: K.text }}>{value}</span>
    </div>
  )
}

function ExerciseRow({ exercise }) {
  const repLabel = exercise.durationSeconds
    ? `${exercise.durationSeconds}s hold`
    : `${exercise.sets} × ${exercise.reps}`

  return (
    <div style={{ backgroundColor: K.inset, border: `1px solid ${K.border}`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: K.text, margin: 0, lineHeight: 1.3 }}>{exercise.name}</p>
        <p style={{ fontSize: 11, color: K.dim, marginTop: 3 }}>{exercise.targetMuscles.join(' · ')}</p>
      </div>
      <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.violet, backgroundColor: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.2)', borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>
        {repLabel}
      </span>
    </div>
  )
}

export default function WorkoutDetail() {
  const { logId } = useParams()
  const { state } = useLocation()
  const navigate  = useNavigate()
  const log       = state?.log

  if (!log) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', backgroundColor: K.bg }}>
        <p style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: K.text, marginBottom: 16 }}>Workout not found.</p>
        <button
          onClick={() => navigate('/history')}
          style={{ background: K.grad, color: '#fff', border: 'none', borderRadius: 12, fontFamily: FONT, fontWeight: 700, fontSize: 15, padding: '12px 24px', cursor: 'pointer' }}
        >
          ← Back to History
        </button>
      </div>
    )
  }

  const exercises = getExercisesForLog(log)

  return (
    <div style={{ minHeight: '100svh', backgroundColor: K.bg }}>
      {/* Hero header */}
      <div style={{ background: K.gradHero, padding: '52px 20px 28px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← Back
        </button>
        <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
          DAY {log.dayNumber}
        </p>
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#fff', lineHeight: 1.15, margin: '0 0 8px' }}>{log.theme}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{formatDateTime(log.completedAt)}</p>
      </div>

      <div style={{ padding: '20px 20px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stats */}
        <section style={{ backgroundColor: K.card, border: `1px solid ${K.borderSt}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Stat label="Duration"  value={formatDuration(log.totalTimeSeconds)} />
          <div style={{ height: 1, backgroundColor: K.border }} />
          <Stat label="Exercises" value={exercises.length} />
          <div style={{ height: 1, backgroundColor: K.border }} />
          <Stat label="Sets"      value={log.totalSets} />
        </section>

        {/* Exercise list */}
        <section>
          <h2 style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: K.dim, textTransform: 'uppercase', marginBottom: 12 }}>
            Exercises Completed
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exercises.length > 0
              ? exercises.map(ex => <ExerciseRow key={ex.id} exercise={ex} />)
              : <p style={{ fontSize: 13, color: K.dim }}>No exercise data available.</p>
            }
          </div>
        </section>

        {/* Do it again */}
        <button
          onClick={() => navigate(`/workout/${log.dayNumber}`)}
          style={{ minHeight: 54, background: K.grad, color: '#fff', border: 'none', borderRadius: 14, fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Icon name="push" size={18} strokeWidth={2} style={{ color: '#fff' }} />
          Do This Workout Again
        </button>
      </div>
    </div>
  )
}
