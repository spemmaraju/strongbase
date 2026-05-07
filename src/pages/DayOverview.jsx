import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import weeklyPlan from '../data/weeklyPlan.json'
import exercises from '../data/exercises.json'
import quotesData from '../data/quotes.json'
import ExerciseModal from '../components/ExerciseModal'
import { randomQuote } from '../utils/workoutStats'

// Map category → display group
function getGroup(category) {
  if (category === 'warm-up') return 'Warm-Up'
  if (category === 'flexibility') return 'Cool-Down'
  return 'Main Workout'
}

const EQUIPMENT_COLORS = {
  'bodyweight':       { bg: '#1E293B', text: '#94A3B8', border: '#334155' },
  'yoga-mat':         { bg: '#1E293B', text: '#94A3B8', border: '#334155' },
  'resistance-band':  { bg: '#14B8A615', text: '#2DD4BF', border: '#14B8A640' },
  '10lb-dumbbells':   { bg: '#7C3AED15', text: '#A78BFA', border: '#7C3AED40' },
  '15lb-dumbbells':   { bg: '#DC262615', text: '#FCA5A5', border: '#DC262640' },
}

function getEqStyle(eq) {
  return EQUIPMENT_COLORS[eq] || { bg: '#1E293B', text: '#94A3B8', border: '#334155' }
}

export default function DayOverview() {
  const { dayNumber } = useParams()
  const navigate = useNavigate()
  const [selectedExercise, setSelectedExercise] = useState(null)

  // Pick a random quote on mount
  const [quote] = useState(() => {
    const parsedDay = parseInt(dayNumber)
    const cat = parsedDay === 4 ? 'rest-day' : 'starting'
    return randomQuote(quotesData, cat)
  })

  const day = weeklyPlan.days.find((d) => d.day === parseInt(dayNumber))

  if (!day) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-center p-6">
          <p className="text-xl font-bold text-white">Day not found.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-3 rounded-xl font-bold"
            style={{ backgroundColor: '#14B8A6', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const exerciseMap = Object.fromEntries(exercises.map((e) => [e.id, e]))
  const dayExercises = day.exerciseIds.map((id) => exerciseMap[id]).filter(Boolean)

  const sections = {}
  dayExercises.forEach((ex) => {
    const group = getGroup(ex.category)
    if (!sections[group]) sections[group] = []
    sections[group].push(ex)
  })

  const sectionOrder = ['Warm-Up', 'Main Workout', 'Cool-Down']

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Header — flat, no gradient, no emoji */}
      <div
        className="px-5 pt-10 pb-5"
        style={{
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #1E293B',
        }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-4 font-medium transition-opacity hover:opacity-70"
          style={{ color: '#14B8A6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← Back
        </button>

        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#14B8A6' }}
        >
          Day {day.day}
        </span>
        <h1 className="text-2xl font-bold text-white mt-1 leading-tight">
          {day.theme}
        </h1>
        {/* Time badge below theme name */}
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
          ⏱ {day.durationMinutes} min
        </p>
        <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
          {day.focusArea}
        </p>
      </div>

      {/* Exercise Sections — pb-24 so last card clears the fixed Start button */}
      <div className="px-5 pt-5 pb-32 space-y-6">
        {sectionOrder.map((sectionName) => {
          const exList = sections[sectionName]
          if (!exList || exList.length === 0) return null
          return (
            <div key={sectionName}>
              {/* Section Header — teal left border style */}
              <h2
                className="text-xs font-semibold tracking-widest uppercase mb-4"
                style={{
                  color: '#94A3B8',
                  borderLeft: '2px solid #14B8A6',
                  paddingLeft: 8,
                }}
              >
                {sectionName}
              </h2>

              {/* Exercise Cards */}
              <div className="space-y-3">
                {exList.map((ex) => {
                  const setsReps = ex.durationSeconds
                    ? `${ex.sets} × ${ex.durationSeconds} sec hold`
                    : `${ex.sets} × ${ex.reps} reps`

                  return (
                    <div
                      key={ex.id}
                      className="rounded-2xl p-4 flex items-start gap-3"
                      style={{
                        backgroundColor: '#1E293B',
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-white leading-snug">{ex.name}</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: '#14B8A6' }}>
                          {setsReps}
                        </p>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: '#94A3B8' }}>
                          {ex.targetMuscles.join(' · ')}
                        </p>
                        {/* Equipment badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ex.equipment.map((eq) => {
                            const s = getEqStyle(eq)
                            return (
                              <span
                                key={eq}
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
                              >
                                {eq.replace(/-/g, ' ')}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      {/* Info button — min 44×44 touch target, mr-1 so never clipped */}
                      <button
                        onClick={() => setSelectedExercise(ex)}
                        className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-lg transition-all active:scale-90"
                        style={{
                          minWidth: 44,
                          minHeight: 44,
                          width: 44,
                          height: 44,
                          backgroundColor: '#334155',
                          color: '#14B8A6',
                          border: 'none',
                          cursor: 'pointer',
                          marginRight: 4,
                        }}
                        aria-label={`Info for ${ex.name}`}
                      >
                        ⓘ
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Motivational Quote */}
        {quote && (
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: '#1E293B',
              borderLeft: '3px solid #14B8A650',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-sm font-medium leading-relaxed italic" style={{ color: '#94A3B8' }}>
              "{quote.text}"
            </p>
            {quote.author !== 'StrongBase' && (
              <p className="text-xs mt-1 font-semibold" style={{ color: '#475569' }}>
                — {quote.author}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Gradient fade + fixed Start Workout button */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        {/* Gradient fade above button */}
        <div
          style={{
            height: 40,
            background: 'linear-gradient(to bottom, transparent, #0F172A)',
            pointerEvents: 'none',
          }}
        />
        <div
          className="px-5 pb-8"
          style={{ backgroundColor: '#0F172A' }}
        >
          <button
            onClick={() => navigate(`/workout/${day.day}`)}
            className="w-full rounded-2xl font-bold text-base text-white transition-all active:scale-95"
            style={{
              backgroundColor: '#14B8A6',
              height: 56,
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
          >
            ▶ Start Workout
          </button>
        </div>
      </div>

      {/* Exercise Modal */}
      {selectedExercise && (
        <ExerciseModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  )
}
