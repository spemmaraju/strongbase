import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import weeklyPlan from '../data/weeklyPlan.json'
import exercises from '../data/exercises.json'
import ExerciseModal from '../components/ExerciseModal'
import { C, FONT, LABEL } from '../styles/tokens'

const BG   = C.bg
const SURF = C.surface
const TEAL = C.teal

const CAT_ACCENT = {
  'warm-up':    '#F59E0B',
  'strength':   '#14B8A6',
  'stability':  '#7C3AED',
  'flexibility':'#22C55E',
  'cardio':     '#3B82F6',
}

function getGroup(category) {
  if (category === 'warm-up')    return 'Warm-Up'
  if (category === 'flexibility') return 'Cool-Down'
  return 'Main Workout'
}

function formatSetsReps(ex) {
  if (ex.durationSeconds) {
    const t = ex.durationSeconds >= 60
      ? `${Math.floor(ex.durationSeconds / 60)}m ${ex.durationSeconds % 60 > 0 ? ex.durationSeconds % 60 + 's' : ''}`.trim()
      : `${ex.durationSeconds}s`
    return `${ex.sets} × ${t}`
  }
  return `${ex.sets} × ${ex.reps} reps`
}

const SECTION_ORDER = ['Warm-Up', 'Main Workout', 'Cool-Down']

export default function DayOverview() {
  const { dayNumber } = useParams()
  const navigate = useNavigate()
  const [selectedExercise, setSelectedExercise] = useState(null)

  const day = weeklyPlan.days.find(d => d.day === parseInt(dayNumber))

  if (!day) {
    return (
      <div style={{ backgroundColor: BG, minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>Day not found.</p>
          <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: '12px 24px', backgroundColor: TEAL, color: BG, borderRadius: 12, border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const exMap = Object.fromEntries(exercises.map(e => [e.id, e]))
  const dayExercises = day.exerciseIds.map(id => exMap[id]).filter(Boolean)

  const sections = {}
  dayExercises.forEach(ex => {
    const g = getGroup(ex.category)
    if (!sections[g]) sections[g] = []
    sections[g].push(ex)
  })

  // Flat numbered list for display
  let counter = 0

  return (
    <div style={{ backgroundColor: BG, minHeight: '100svh' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '48px 20px 24px', borderBottom: `1px solid rgba(51,65,85,0.4)` }}>
        <button
          onClick={() => navigate('/')}
          style={{ color: TEAL, background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, padding: '4px 0', marginBottom: 16, minHeight: 44, display: 'flex', alignItems: 'center' }}
        >
          ← Back
        </button>

        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: TEAL, textTransform: 'uppercase', marginBottom: 4 }}>
          Day {day.day}
        </p>
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#F8FAFC', lineHeight: 1.15, margin: 0 }}>
          {day.theme}
        </h1>
        <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 6 }}>
          ⏱ {day.durationMinutes} min · {day.focusArea}
        </p>
      </div>

      {/* ── Exercise list ───────────────────────────────────────────────────── */}
      <div style={{ padding: '8px 0', paddingBottom: 120 }}>
        {SECTION_ORDER.map(sectionName => {
          const exList = sections[sectionName]
          if (!exList?.length) return null
          return (
            <div key={sectionName} style={{ marginTop: 24 }}>
              {/* Section label */}
              <p style={{ ...LABEL, padding: '0 20px', marginBottom: 4 }}>{sectionName}</p>

              {exList.map(ex => {
                counter++
                const num = counter
                const accent = CAT_ACCENT[ex.category] || TEAL
                return (
                  <div
                    key={ex.id}
                    style={{
                      display: 'flex', alignItems: 'center',
                      padding: '13px 20px',
                      borderBottom: '1px solid rgba(51,65,85,0.35)',
                    }}
                  >
                    {/* Number dot */}
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: SURF,
                      border: `1.5px solid rgba(51,65,85,0.6)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginRight: 14,
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>{num}</span>
                    </div>

                    {/* Name + sets×reps */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 600, color: '#F8FAFC', margin: 0, lineHeight: 1.2 }}>
                        {ex.name}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: accent, margin: 0, marginTop: 3 }}>
                        {formatSetsReps(ex)}
                      </p>
                    </div>

                    {/* Info button */}
                    <button
                      onClick={() => setSelectedExercise(ex)}
                      style={{
                        width: 44, height: 44, flexShrink: 0,
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: 4,
                      }}
                      aria-label={`Info: ${ex.name}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* ── Fixed Start button ──────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
        <div style={{ height: 32, background: `linear-gradient(to bottom, transparent, ${BG})`, pointerEvents: 'none' }} />
        <div style={{ backgroundColor: BG, padding: '0 16px', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)', paddingTop: 4 }}>
          <button
            onClick={() => navigate(`/workout/${day.day}`)}
            style={{
              width: '100%', minHeight: 56,
              backgroundColor: TEAL, color: BG,
              borderRadius: 16, border: 'none',
              fontFamily: FONT, fontWeight: 700, fontSize: 16,
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = TEAL}
          >
            Start Workout →
          </button>
        </div>
      </div>

      {selectedExercise && (
        <ExerciseModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
      )}
    </div>
  )
}
