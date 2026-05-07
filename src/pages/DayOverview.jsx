import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import weeklyPlan from '../data/weeklyPlan.json'
import exercises from '../data/exercises.json'
import quotesData from '../data/quotes.json'
import ExerciseModal from '../components/ExerciseModal'
import { randomQuote } from '../utils/workoutStats'

const SECTION_ORDER = ['warm-up', 'strength', 'stability', 'cardio', 'flexibility']
const SECTION_LABELS = {
  'warm-up': 'Warm-Up',
  'strength': 'Main Workout',
  'stability': 'Main Workout',
  'cardio': 'Main Workout',
  'flexibility': 'Cool-Down'
}
// Map category → display group
function getGroup(category) {
  if (category === 'warm-up') return 'Warm-Up'
  if (category === 'flexibility') return 'Cool-Down'
  return 'Main Workout'
}

const EQUIPMENT_COLORS = {
  'bodyweight': { bg: '#1E293B', text: '#94A3B8', border: '#334155' },
  'yoga-mat': { bg: '#1E293B', text: '#94A3B8', border: '#334155' },
  'resistance-band': { bg: '#14B8A615', text: '#2DD4BF', border: '#14B8A640' },
  '10lb-dumbbells': { bg: '#7C3AED15', text: '#A78BFA', border: '#7C3AED40' },
  '15lb-dumbbells': { bg: '#DC262615', text: '#FCA5A5', border: '#DC262640' },
}

function getEqStyle(eq) {
  return EQUIPMENT_COLORS[eq] || { bg: '#1E293B', text: '#94A3B8', border: '#334155' }
}

export default function DayOverview() {
  const { dayNumber } = useParams()
  const navigate = useNavigate()
  const [selectedExercise, setSelectedExercise] = useState(null)

  // Pick a random quote on mount; rest-day category for Day 4, starting for others
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
            style={{ backgroundColor: '#14B8A6', color: '#fff' }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Build ordered exercise objects for this day
  const exerciseMap = Object.fromEntries(exercises.map((e) => [e.id, e]))
  const dayExercises = day.exerciseIds
    .map((id) => exerciseMap[id])
    .filter(Boolean)

  // Group into Warm-Up / Main Workout / Cool-Down
  const sections = {}
  dayExercises.forEach((ex) => {
    const group = getGroup(ex.category)
    if (!sections[group]) sections[group] = []
    sections[group].push(ex)
  })

  const sectionOrder = ['Warm-Up', 'Main Workout', 'Cool-Down']

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#0F172A' }}>
      {/* Header */}
      <div
        className="px-5 pt-10 pb-6"
        style={{
          background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
          borderBottom: '1px solid #334155'
        }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-4 font-medium transition-opacity hover:opacity-70"
          style={{ color: '#14B8A6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← Back
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: '#14B8A6' }}
            >
              Day {day.day}
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-1 leading-tight">
              {day.theme}
            </h1>
            <p className="text-sm mt-1 leading-snug" style={{ color: '#94A3B8' }}>
              {day.focusArea}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="text-4xl">{day.emoji}</span>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}
            >
              ⏱ {day.durationMinutes} min
            </span>
          </div>
        </div>
      </div>

      {/* Exercise Sections */}
      <div className="px-5 pt-5 space-y-6">
        {sectionOrder.map((sectionName) => {
          const exList = sections[sectionName]
          if (!exList || exList.length === 0) return null
          return (
            <div key={sectionName}>
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
                  {sectionName}
                </h2>
                <div className="flex-1 h-px" style={{ backgroundColor: '#334155' }} />
              </div>

              {/* Exercise Cards */}
              <div className="space-y-3">
                {exList.map((ex) => {
                  const setsReps = ex.durationSeconds
                    ? `${ex.sets} × ${ex.durationSeconds} sec hold`
                    : `${ex.sets} × ${ex.reps} reps`

                  return (
                    <div
                      key={ex.id}
                      className="rounded-xl p-4 flex items-start gap-3"
                      style={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white leading-snug">{ex.name}</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: '#14B8A6' }}>
                          {setsReps}
                        </p>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: '#64748B' }}>
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

                      {/* Info button */}
                      <button
                        onClick={() => setSelectedExercise(ex)}
                        className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-lg transition-all active:scale-90"
                        style={{
                          width: 44,
                          height: 44,
                          backgroundColor: '#334155',
                          color: '#14B8A6',
                          border: 'none',
                          cursor: 'pointer'
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
      </div>

      {/* Motivational Quote */}
      {quote && (
        <div
          className="mx-5 mt-4 rounded-xl p-4"
          style={{
            backgroundColor: '#1E293B',
            borderLeft: '3px solid #14B8A650',
            marginBottom: 8,
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

      {/* Start Workout Button (fixed bottom) */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4"
        style={{
          background: 'linear-gradient(0deg, #0F172A 60%, transparent 100%)',
          maxWidth: 600,
          margin: '0 auto',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%'
        }}
      >
        <button
          onClick={() => navigate(`/workout/${day.day}`)}
          className="w-full rounded-xl font-bold text-base text-white transition-all active:scale-95"
          style={{
            backgroundColor: '#14B8A6',
            minHeight: 56,
            padding: '16px 20px',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
        >
          ▶ Start Workout
        </button>
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
