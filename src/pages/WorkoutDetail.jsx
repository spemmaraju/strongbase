import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getExercisesForLog, formatDuration, formatDate, formatDateTime } from '../utils/workoutStats'

function Stat({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium" style={{ color: '#94A3B8' }}>{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  )
}

function ExerciseRow({ exercise }) {
  const repLabel = exercise.durationSeconds
    ? `${exercise.durationSeconds}s hold`
    : `${exercise.sets} × ${exercise.reps} reps`

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">{exercise.name}</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748B' }}>
            {exercise.targetMuscles.join(' · ')}
          </p>
        </div>
        <span
          className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full"
          style={{ backgroundColor: '#14B8A615', color: '#14B8A6', whiteSpace: 'nowrap' }}
        >
          {repLabel}
        </span>
      </div>
    </div>
  )
}

export default function WorkoutDetail() {
  const { logId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const log = state?.log

  // Graceful fallback if navigated directly without state
  if (!log) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: '#0F172A' }}>
        <p className="text-xl font-bold text-white mb-4">Workout not found.</p>
        <button
          onClick={() => navigate('/history')}
          className="rounded-xl font-bold text-white px-6 py-3"
          style={{ backgroundColor: '#14B8A6', border: 'none', cursor: 'pointer' }}
        >
          ← Back to History
        </button>
      </div>
    )
  }

  const exercises = getExercisesForLog(log)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: 'linear-gradient(180deg, #0D9488 0%, #0F172A 100%)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-sm font-semibold"
          style={{ color: '#99F6E4', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← Back
        </button>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#99F6E4' }}>
          Day {log.dayNumber}
        </p>
        <h1 className="text-3xl font-extrabold text-white leading-tight">{log.theme}</h1>
        <p className="text-sm mt-1" style={{ color: '#99F6E4' }}>
          {formatDateTime(log.completedAt)}
        </p>
      </div>

      <div className="px-5 pb-12 space-y-5">

        {/* Stats */}
        <section
          className="rounded-xl p-5 space-y-3"
          style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
        >
          <Stat label="Duration" value={formatDuration(log.totalTimeSeconds)} />
          <div style={{ height: 1, backgroundColor: '#334155' }} />
          <Stat label="Exercises" value={exercises.length} />
          <div style={{ height: 1, backgroundColor: '#334155' }} />
          <Stat label="Sets" value={log.totalSets} />
        </section>

        {/* Exercise list */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
            Exercises Completed
          </h2>
          <div className="space-y-2">
            {exercises.length > 0 ? (
              exercises.map(ex => <ExerciseRow key={ex.id} exercise={ex} />)
            ) : (
              <p className="text-sm" style={{ color: '#64748B' }}>No exercise data available.</p>
            )}
          </div>
        </section>

        {/* Do it again button */}
        <button
          onClick={() => navigate(`/workout/${log.dayNumber}`)}
          className="w-full rounded-xl font-bold text-base text-white transition-all active:scale-95"
          style={{ minHeight: 56, backgroundColor: '#14B8A6', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
        >
          ▶ Do This Workout Again
        </button>

      </div>
    </div>
  )
}
