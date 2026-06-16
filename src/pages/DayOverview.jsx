import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import weeklyPlan from '../data/weeklyPlan.json'
import exercises from '../data/exercises.json'
import ExerciseModal from '../components/ExerciseModal'
import useAuth from '../hooks/useAuth'
import useMediaQuery from '../hooks/useMediaQuery'
import { buildSessionExercises, estimateMinutes } from '../utils/sessionPlan'
import { getDayComposition } from '../utils/workoutStats'
import { Icon } from '../components/Icons'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  bg:      '#0a0e1a',
  rail:    '#0c1322',
  card:    '#101828',
  panel:   '#0a111e',
  inset:   '#16233a',
  border:  'rgba(255,255,255,0.06)',
  borderSt:'rgba(255,255,255,0.10)',
  pink:    '#ec4899',
  purple:  '#8b5cf6',
  violet:  '#c084fc',
  grad:    'linear-gradient(90deg, #ec4899, #8b5cf6)',
  gradD:   'linear-gradient(135deg, #ec4899, #8b5cf6)',
  gradH:   'linear-gradient(130deg, #fb923c 0%, #ec4899 48%, #8b5cf6 100%)',
  amber:   '#f59e0b',
  teal:    '#2dd4bf',
  text:    '#f8fafc',
  muted:   '#94a3b8',
  subtle:  '#64748b',
  dim:     '#475569',
}

const KCAT = {
  'warm-up':   K.amber,
  strength:    K.pink,
  stability:   K.purple,
  flexibility: K.teal,
  cardio:      '#3b82f6',
}

const LENGTH_OPTIONS = [
  { id: 'quick',    label: 'Quick'    },
  { id: 'standard', label: 'Standard' },
  { id: 'full',     label: 'Full'     },
]

const SECTION_ORDER = ['Warm-Up', 'Main Workout', 'Cool-Down', 'Back Care']

function getGroup(ex) {
  if (ex.backCare)                   return 'Back Care'
  if (ex.category === 'warm-up')     return 'Warm-Up'
  if (ex.category === 'flexibility') return 'Cool-Down'
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

// Section label + color dot
const SECTION_META = {
  'Warm-Up':     { dot: K.amber,  icon: 'warmup'   },
  'Main Workout':{ dot: K.pink,   icon: 'strength' },
  'Cool-Down':   { dot: K.teal,   icon: 'cooldown' },
  'Back Care':   { dot: K.purple, icon: 'sunrise'  },
}

export default function DayOverview() {
  const { dayNumber } = useParams()
  const navigate      = useNavigate()
  const { user }      = useAuth()
  const isWide        = useMediaQuery('(min-width: 768px)')

  const [selectedExercise, setSelectedExercise] = useState(null)
  const [mode, setMode] = useState(
    () => localStorage.getItem('strongbase_workout_mode') || 'home',
  )
  const [sessionLength, setSessionLength] = useState(
    () => localStorage.getItem('strongbase_session_length') || 'full',
  )

  function toggleMode(m) {
    setMode(m)
    localStorage.setItem('strongbase_workout_mode', m)
  }

  function pickLength(len) {
    setSessionLength(len)
    localStorage.setItem('strongbase_session_length', len)
  }

  const day = weeklyPlan.days.find(d => d.day === parseInt(dayNumber))

  if (!day) {
    return (
      <div style={{ backgroundColor: K.bg, minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: K.text }}>Day not found.</p>
          <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: '12px 24px', background: K.gradD, color: '#fff', borderRadius: 12, border: 'none', fontFamily: FONT, fontWeight: 700, cursor: 'pointer' }}>
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const userEquipment = user?.user_metadata?.equipment || ['bodyweight']
  const exMap         = Object.fromEntries(exercises.map(e => [e.id, e]))
  const dayExercises  = buildSessionExercises(day, exMap, { mode, userEquipment, sessionLength })
  const estMinutes    = estimateMinutes(dayExercises)

  const chipMinutes = Object.fromEntries(LENGTH_OPTIONS.map(opt => [
    opt.id,
    estimateMinutes(buildSessionExercises(day, exMap, { mode, userEquipment, sessionLength: opt.id })),
  ]))

  const sections = {}
  dayExercises.forEach(ex => {
    const g = getGroup(ex)
    if (!sections[g]) sections[g] = []
    sections[g].push(ex)
  })

  const comp = getDayComposition(day)

  // Global exercise counter across sections
  let counter = 0

  // ── Left hero panel ────────────────────────────────────────────────────────
  const HeroPanel = (
    <div style={{
      background: K.gradH,
      borderRadius: isWide ? '0 0 0 0' : '0 0 20px 20px',
      position: 'relative', overflow: 'hidden',
      padding: isWide ? '28px 28px 32px' : '24px 20px 28px',
      minHeight: isWide ? '100%' : 'auto',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Hatch texture overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 8px)',
      }} />

      {/* Watermark */}
      <div style={{ position: 'absolute', right: -20, bottom: -20, color: '#fff', opacity: 0.07, pointerEvents: 'none' }}>
        <Icon name="strength" size={160} strokeWidth={0.8} />
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 10, color: 'rgba(255,255,255,0.8)',
          fontFamily: MONO, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em',
          cursor: 'pointer', padding: '6px 12px', marginBottom: 20,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          backdropFilter: 'blur(4px)', alignSelf: 'flex-start', zIndex: 1,
        }}
      >
        ← BACK
      </button>

      {/* DAY N chip */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(6px)',
        borderRadius: 99, padding: '5px 12px', marginBottom: 12,
        border: '1px solid rgba(255,255,255,0.14)', alignSelf: 'flex-start', zIndex: 1,
      }}>
        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.violet, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Day {day.day} of 7
        </span>
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#fff', lineHeight: 1.1, margin: 0, zIndex: 1 }}>
        {day.theme}
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: 6, lineHeight: 1.4, zIndex: 1 }}>
        {day.focusArea}
      </p>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="clock" size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
            ~{estMinutes} min
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="target" size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
            {dayExercises.length} exercises
          </span>
        </div>
      </div>

      {/* Composition bar */}
      {comp?.total > 0 && (
        <div style={{ height: 3, borderRadius: 999, overflow: 'hidden', display: 'flex', gap: 2, marginTop: 16, zIndex: 1 }}>
          {Object.entries(comp.counts).filter(([, n]) => n > 0).map(([cat, n]) => (
            <div key={cat} style={{ flex: n / comp.total, backgroundColor: KCAT[cat] || '#475569', borderRadius: 1 }} />
          ))}
        </div>
      )}

      {/* Spacer before controls */}
      <div style={{ flex: 1, minHeight: 20 }} />

      {/* Controls */}
      <div style={{ zIndex: 1, backdropFilter: 'blur(2px)' }}>

        {/* Home / Gym toggle */}
        <div style={{
          display: 'inline-flex', marginBottom: 14,
          backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: 99,
          padding: 3, border: '1px solid rgba(255,255,255,0.14)',
        }}>
          {['home', 'gym'].map(m => (
            <button key={m} onClick={() => toggleMode(m)} style={{
              padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
              background: mode === m ? K.gradD : 'transparent',
              color: mode === m ? '#fff' : 'rgba(255,255,255,0.5)',
              fontFamily: MONO, fontWeight: 700, fontSize: 9,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              transition: 'all 0.15s',
            }}>{m}</button>
          ))}
        </div>

        {/* Session length */}
        <div>
          <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            How much time today?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {LENGTH_OPTIONS.map(opt => {
              const sel = sessionLength === opt.id
              return (
                <button key={opt.id} onClick={() => pickLength(opt.id)} style={{
                  flex: 1, padding: '9px 4px', borderRadius: 12, cursor: 'pointer',
                  backgroundColor: sel ? 'rgba(192,132,252,0.18)' : 'rgba(0,0,0,0.22)',
                  border: sel ? '1.5px solid rgba(192,132,252,0.45)' : '1.5px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(4px)', transition: 'all 0.15s',
                }}>
                  <span style={{ display: 'block', fontFamily: FONT, fontWeight: 700, fontSize: 13, color: sel ? K.violet : 'rgba(255,255,255,0.55)' }}>
                    {opt.label}
                  </span>
                  <span style={{ display: 'block', fontFamily: MONO, fontSize: 10, fontWeight: 700, color: sel ? 'rgba(192,132,252,0.75)' : 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    ~{chipMinutes[opt.id]}m
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Start CTA (inside panel on wide only) */}
        {isWide && (
          <button
            onClick={() => navigate(`/workout/${day.day}`)}
            style={{
              marginTop: 18, width: '100%', minHeight: 52,
              background: 'rgba(0,0,0,0.32)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 14,
              fontFamily: FONT, fontWeight: 700, fontSize: 15,
              cursor: 'pointer', backdropFilter: 'blur(4px)',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.32)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          >
            Start Day {day.day} Workout →
          </button>
        )}
      </div>
    </div>
  )

  // ── Exercise list ──────────────────────────────────────────────────────────
  const ExerciseList = (
    <div style={{ padding: isWide ? '24px 28px 40px' : '0 0 120px' }}>
      {SECTION_ORDER.map(sectionName => {
        const exList = sections[sectionName]
        if (!exList?.length) return null
        const meta = SECTION_META[sectionName] || { dot: K.dim }
        return (
          <div key={sectionName} style={{ marginBottom: isWide ? 28 : 20 }}>
            {/* Section header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: isWide ? '0 0 10px' : '18px 20px 8px',
              borderBottom: `1px solid ${K.border}`,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: meta.dot, flexShrink: 0 }} />
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {sectionName}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, marginLeft: 'auto' }}>
                {exList.length}
              </span>
            </div>

            {exList.map(ex => {
              counter++
              const num    = counter
              const accent = KCAT[ex.category] || K.violet
              return (
                <div
                  key={ex.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: isWide ? '12px 0' : '12px 20px',
                    borderBottom: `1px solid ${K.border}`,
                  }}
                >
                  {/* Gradient number badge */}
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: K.grad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#fff' }}>{num}</span>
                  </div>

                  {/* Name + sets×reps */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: K.text, margin: 0, lineHeight: 1.2 }}>
                      {ex.name}
                    </p>
                    <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: accent, margin: 0, marginTop: 3, letterSpacing: '0.06em' }}>
                      {formatSetsReps(ex)}
                    </p>
                  </div>

                  {/* Category dot */}
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: accent, flexShrink: 0 }} />

                  {/* Info button */}
                  <button
                    onClick={() => setSelectedExercise(ex)}
                    style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    aria-label={`Info: ${ex.name}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={K.subtle} strokeWidth="2" strokeLinecap="round">
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
  )

  return (
    <div style={{
      backgroundColor: K.bg, minHeight: '100svh',
      // account for fixed left rail on wide screens
      paddingLeft: isWide ? 80 : 0,
    }}>

      {isWide ? (
        /* ── Wide: sticky left panel + scrollable right ────────────────────── */
        <div style={{ display: 'flex', minHeight: '100svh', alignItems: 'stretch' }}>
          {/* Left hero panel — sticky */}
          <div style={{ width: 380, flexShrink: 0, position: 'sticky', top: 0, height: '100svh', overflow: 'auto' }}>
            {HeroPanel}
          </div>
          {/* Divider */}
          <div style={{ width: 1, backgroundColor: K.border, flexShrink: 0 }} />
          {/* Right: exercise list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {ExerciseList}
          </div>
        </div>

      ) : (
        /* ── Narrow: stacked ───────────────────────────────────────────────── */
        <>
          {HeroPanel}
          {ExerciseList}

          {/* Fixed Start button */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
            <div style={{ height: 32, background: `linear-gradient(to bottom, transparent, ${K.bg})`, pointerEvents: 'none' }} />
            <div style={{
              backgroundColor: K.bg, padding: '0 16px',
              paddingBottom: 'max(env(safe-area-inset-bottom), 24px)', paddingTop: 4,
            }}>
              <button
                onClick={() => navigate(`/workout/${day.day}`)}
                style={{
                  width: '100%', minHeight: 56,
                  background: K.gradD, color: '#fff',
                  borderRadius: 16, border: 'none',
                  fontFamily: FONT, fontWeight: 700, fontSize: 16,
                  cursor: 'pointer', letterSpacing: '0.01em',
                }}
              >
                Start Day {day.day} Workout →
              </button>
            </div>
          </div>
        </>
      )}

      {selectedExercise && (
        <ExerciseModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
      )}
    </div>
  )
}
