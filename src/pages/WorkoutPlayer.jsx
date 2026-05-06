import { useParams, useNavigate } from 'react-router-dom'
import weeklyPlan from '../data/weeklyPlan.json'

export default function WorkoutPlayer() {
  const { dayNumber } = useParams()
  const navigate = useNavigate()
  const day = weeklyPlan.days.find((d) => d.day === parseInt(dayNumber))

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: '#0F172A' }}
    >
      <span className="text-6xl mb-6">🏗️</span>
      <h1 className="text-2xl font-extrabold text-white mb-3">
        Workout Player
      </h1>
      <p className="text-base font-medium mb-2" style={{ color: '#14B8A6' }}>
        Coming in Phase 2
      </p>
      <p className="text-sm leading-relaxed mb-8" style={{ color: '#94A3B8', maxWidth: 280 }}>
        {day
          ? `Day ${day.day} — ${day.theme} workout player with live timers, rest periods, and exercise progression is on the way.`
          : 'The interactive workout player with live timers and rest periods is coming soon.'}
      </p>
      <button
        onClick={() => navigate(day ? `/day/${dayNumber}` : '/')}
        className="rounded-xl font-bold text-base text-white transition-all active:scale-95"
        style={{
          backgroundColor: '#14B8A6',
          minHeight: 52,
          padding: '14px 32px',
          border: 'none',
          cursor: 'pointer'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
      >
        ← Back to Day Overview
      </button>
    </div>
  )
}
