import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import weeklyPlan from '../data/weeklyPlan.json'
import exercises from '../data/exercises.json'
import ExerciseModal from '../components/ExerciseModal'
import ExerciseBrowser from '../components/ExerciseBrowser'
import useAuth from '../hooks/useAuth'
import useMediaQuery from '../hooks/useMediaQuery'
import useSessionDraft from '../hooks/useSessionDraft'
import useSaveWorkoutLog from '../hooks/useSaveWorkoutLog'
import useWakeLock from '../hooks/useWakeLock'
import { estimateMinutes } from '../utils/sessionPlan'
import { getDayComposition } from '../utils/workoutStats'
import { Icon } from '../components/Icons'

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
  gradH:   'linear-gradient(130deg, #fb923c 0%, #ec4899 48%, #8b5cf6 100%)',
  amber:   '#f59e0b',
  teal:    '#2dd4bf',
  green:   '#22c55e',
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

function formatSetsReps(ex) {
  if (ex.durationSeconds) {
    const t = ex.durationSeconds >= 60
      ? `${Math.floor(ex.durationSeconds / 60)}m ${ex.durationSeconds % 60 > 0 ? ex.durationSeconds % 60 + 's' : ''}`.trim()
      : `${ex.durationSeconds}s`
    return `${ex.sets} × ${t}`
  }
  return `${ex.sets} × ${ex.reps} reps`
}

export default function DayOverview() {
  const { dayNumber } = useParams()
  const navigate      = useNavigate()
  const { user }      = useAuth()
  const isWide        = useMediaQuery('(min-width: 768px)')

  const [selectedExercise, setSelectedExercise] = useState(null)
  const [browsing, setBrowsing] = useState(null)   // null | {replacing?: exercise}
  const [menuFor, setMenuFor]   = useState(null)   // exercise id with its row menu open
  const [finished, setFinished] = useState(null)   // completion summary

  const [mode, setMode] = useState(
    () => localStorage.getItem('strongbase_workout_mode') || 'home',
  )

  function toggleMode(m) {
    setMode(m)
    localStorage.setItem('strongbase_workout_mode', m)
  }

  const day = weeklyPlan.days.find(d => d.day === parseInt(dayNumber))

  // Memoised — a fresh identity here would rebuild the session seed every render.
  const exMap = useMemo(() => Object.fromEntries(exercises.map(e => [e.id, e])), [])
  const userEquipment = user?.user_metadata?.equipment || ['bodyweight']

  const session = useSessionDraft(day, exMap, {
    mode, userEquipment, sessionLength: 'full',
  })

  const { save, status: saveStatus } = useSaveWorkoutLog()

  // You now look at this screen for the whole workout, so it must not sleep.
  useWakeLock(!finished)

  // Wall-clock from the first tick, so the log still carries a duration.
  const startedAtRef = useRef(null)
  useEffect(() => {
    if (session.doneCount > 0 && !startedAtRef.current) startedAtRef.current = Date.now()
  }, [session.doneCount])

  useEffect(() => {
    if (!menuFor) return
    const close = () => setMenuFor(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [menuFor])

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

  const dayExercises = session.exercises
  const estMinutes   = estimateMinutes(dayExercises)
  const comp         = getDayComposition(day)
  const canComplete  = session.doneCount > 0

  // Primary muscles across the current draft, most-covered first.
  const sessionMuscles = (() => {
    const c = new Map()
    dayExercises.forEach(e => (e.primaryMuscles || []).forEach(m => c.set(m, (c.get(m) || 0) + 1)))
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => x[0])
  })()

  async function handleComplete() {
    const doneIds = dayExercises.filter(e => session.doneSet.has(e.id)).map(e => e.id)
    const elapsed = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : 0
    const totalSets = session.totalSets

    await save({
      day,
      completedExerciseIds: doneIds,
      totalSets,
      totalTimeSeconds: elapsed,
    })

    setFinished({ count: doneIds.length, totalSets, elapsed, xp: totalSets * 25 })
  }

  // ── Left hero panel ────────────────────────────────────────────────────────
  const HeroPanel = (
    <div style={{
      background: K.gradH,
      borderRadius: isWide ? 0 : '0 0 20px 20px',
      position: 'relative', overflow: 'hidden',
      padding: isWide ? '28px 28px 32px' : '24px 20px 28px',
      minHeight: isWide ? '100%' : 'auto',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 8px)',
      }} />
      <div style={{ position: 'absolute', right: -20, bottom: -20, color: '#fff', opacity: 0.07, pointerEvents: 'none' }}>
        <Icon name="strength" size={160} strokeWidth={0.8} />
      </div>

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
      >← BACK</button>

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

      <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#fff', lineHeight: 1.1, margin: 0, zIndex: 1 }}>
        {day.theme}
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: 6, lineHeight: 1.4, zIndex: 1 }}>
        {day.focusArea}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="clock" size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
            ~{estMinutes} min
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="check" size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
            {session.doneCount} / {dayExercises.length} done
          </span>
        </div>
      </div>

      {/* Progress bar — fills as you tick things off */}
      <div style={{ height: 4, borderRadius: 999, overflow: 'hidden', marginTop: 14, backgroundColor: 'rgba(0,0,0,0.28)', zIndex: 1 }}>
        <div style={{
          height: '100%', borderRadius: 999, backgroundColor: '#fff',
          width: dayExercises.length ? `${(session.doneCount / dayExercises.length) * 100}%` : '0%',
          transition: 'width 0.25s ease',
        }} />
      </div>

      {comp?.total > 0 && (
        <div style={{ height: 3, borderRadius: 999, overflow: 'hidden', display: 'flex', gap: 2, marginTop: 10, zIndex: 1 }}>
          {Object.entries(comp.counts).filter(([, n]) => n > 0).map(([cat, n]) => (
            <div key={cat} style={{ flex: n / comp.total, backgroundColor: KCAT[cat] || '#475569', borderRadius: 1 }} />
          ))}
        </div>
      )}

      {/* What this session actually covers — derived from the live draft, so it
          updates as you swap things in and out. Also stops the tall iPad-portrait
          panel from being mostly empty gradient. */}
      {sessionMuscles.length > 0 && (
        <div style={{ marginTop: 20, zIndex: 1 }}>
          <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            You'll train
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {sessionMuscles.map(m => (
              <span key={m} style={{
                fontFamily: MONO, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                backgroundColor: 'rgba(0,0,0,0.24)', color: 'rgba(255,255,255,0.72)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 99, padding: '4px 9px', backdropFilter: 'blur(4px)',
              }}>{m}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 20 }} />

      <div style={{ zIndex: 1, backdropFilter: 'blur(2px)' }}>
        {/* Home / Gym */}
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

        {session.isCustomised && (
          <button
            onClick={session.resetToSuggested}
            style={{
              display: 'block', background: 'none', border: 'none', padding: 0,
              cursor: 'pointer', marginBottom: 14,
              fontFamily: MONO, fontSize: 9.5, fontWeight: 700,
              color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em',
              textTransform: 'uppercase', textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >↺ Reset to suggested</button>
        )}

        {isWide && (
          <>
            <button
              onClick={handleComplete}
              disabled={!canComplete || saveStatus === 'saving'}
              style={{
                width: '100%', minHeight: 52, marginBottom: 8,
                background: canComplete ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.28)',
                color: canComplete ? '#0a0e1a' : 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14,
                fontFamily: FONT, fontWeight: 800, fontSize: 15,
                cursor: canComplete ? 'pointer' : 'not-allowed',
                backdropFilter: 'blur(4px)',
              }}
            >
              {saveStatus === 'saving' ? 'Saving…' : `Mark day complete${canComplete ? ` (${session.doneCount})` : ''}`}
            </button>
            <button
              onClick={() => navigate(`/workout/${day.day}`)}
              style={{
                width: '100%', minHeight: 42,
                background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12,
                fontFamily: FONT, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', backdropFilter: 'blur(4px)',
              }}
            >▶ Guided mode (timed)</button>
          </>
        )}
      </div>
    </div>
  )

  // ── Exercise list ──────────────────────────────────────────────────────────
  const ExerciseList = (
    <div style={{ padding: isWide ? '24px 28px 40px' : '14px 0 190px' }}>
      {dayExercises.map((ex, i) => {
        const accent = KCAT[ex.category] || K.violet
        const done   = session.doneSet.has(ex.id)
        return (
          <div
            key={ex.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: isWide ? '10px 0' : '10px 16px',
              borderBottom: `1px solid ${K.border}`,
              opacity: done ? 0.55 : 1,
              transition: 'opacity 0.18s',
            }}
          >
            {/* Tick — the primary interaction */}
            <button
              onClick={() => session.toggleDone(ex.id)}
              aria-label={done ? `Mark ${ex.name} not done` : `Mark ${ex.name} done`}
              style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                background: done ? K.green : 'transparent',
                border: done ? 'none' : `2px solid ${K.dim}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {done && <Icon name="check" size={15} strokeWidth={3} style={{ color: '#0a0e1a' }} />}
            </button>

            {/* Name + sets/reps */}
            <button
              onClick={() => setSelectedExercise(ex)}
              style={{
                flex: 1, minWidth: 0, textAlign: 'left', cursor: 'pointer',
                background: 'none', border: 'none', padding: 0,
              }}
            >
              <p style={{
                fontFamily: FONT, fontSize: 14.5, fontWeight: 700, color: K.text,
                margin: 0, lineHeight: 1.25,
                textDecoration: done ? 'line-through' : 'none',
              }}>
                {ex.name}
                {ex.backCare && (
                  <span style={{
                    marginLeft: 8, fontFamily: MONO, fontSize: 8, fontWeight: 700,
                    color: K.purple, backgroundColor: 'rgba(139,92,246,0.14)',
                    border: '1px solid rgba(139,92,246,0.28)',
                    borderRadius: 99, padding: '2px 6px', letterSpacing: '0.08em',
                    verticalAlign: 'middle', whiteSpace: 'nowrap',
                  }}>BACK CARE</span>
                )}
              </p>
              <p style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: accent, margin: '3px 0 0', letterSpacing: '0.06em' }}>
                {formatSetsReps(ex)}
              </p>
            </button>

            {/* Reorder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              {[['▲', i - 1, i === 0], ['▼', i + 1, i === dayExercises.length - 1]].map(([glyph, to, disabled]) => (
                <button
                  key={glyph}
                  onClick={() => session.move(i, to)}
                  disabled={disabled}
                  aria-label={glyph === '▲' ? `Move ${ex.name} up` : `Move ${ex.name} down`}
                  style={{
                    width: 26, height: 17, borderRadius: 5,
                    backgroundColor: disabled ? 'transparent' : K.inset,
                    border: `1px solid ${disabled ? 'transparent' : K.border}`,
                    color: disabled ? K.dim : K.muted,
                    cursor: disabled ? 'default' : 'pointer',
                    fontSize: 8, lineHeight: 1, padding: 0,
                    opacity: disabled ? 0.3 : 1,
                  }}
                >{glyph}</button>
              ))}
            </div>

            {/* Row menu */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={e => { e.stopPropagation(); setMenuFor(menuFor === ex.id ? null : ex.id) }}
                aria-label={`Options: ${ex.name}`}
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
                  cursor: 'pointer', color: K.subtle, fontSize: 15, lineHeight: 1,
                }}
              >⋯</button>

              {menuFor === ex.id && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', right: 0, top: 36, zIndex: 20, minWidth: 150,
                    backgroundColor: K.card, border: `1px solid ${K.borderSt}`,
                    borderRadius: 12, padding: 5,
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {[
                    { label: 'Details',  fn: () => setSelectedExercise(ex) },
                    { label: 'Swap out', fn: () => setBrowsing({ replacing: ex }) },
                    { label: 'Remove',   fn: () => session.remove(ex.id), danger: true },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => { item.fn(); setMenuFor(null) }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                        background: 'none', border: 'none',
                        fontFamily: FONT, fontSize: 13, fontWeight: 600,
                        color: item.danger ? '#fca5a5' : K.text,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = K.inset }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >{item.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {dayExercises.length === 0 && (
        <p style={{ textAlign: 'center', color: K.dim, fontSize: 14, padding: '36px 20px' }}>
          Nothing in this session yet. Add an exercise to get going.
        </p>
      )}

      {/* Add */}
      <button
        onClick={() => setBrowsing({})}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: isWide ? '100%' : 'calc(100% - 32px)',
          margin: isWide ? '18px 0 0' : '18px 16px 0',
          minHeight: 46, borderRadius: 12, cursor: 'pointer',
          backgroundColor: 'transparent', border: `1.5px dashed ${K.borderSt}`,
          color: K.muted, fontFamily: FONT, fontWeight: 700, fontSize: 13.5,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = K.violet; e.currentTarget.style.color = K.violet }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = K.borderSt; e.currentTarget.style.color = K.muted }}
      >＋ Add an exercise</button>
    </div>
  )

  return (
    <div style={{ backgroundColor: K.bg, minHeight: '100svh', paddingLeft: isWide ? 80 : 0 }}>
      {isWide ? (
        <div style={{ display: 'flex', minHeight: '100svh', alignItems: 'stretch' }}>
          <div style={{ width: 380, flexShrink: 0, position: 'sticky', top: 0, height: '100svh', overflow: 'auto' }}>
            {HeroPanel}
          </div>
          <div style={{ width: 1, backgroundColor: K.border, flexShrink: 0 }} />
          <div style={{ flex: 1, overflowY: 'auto' }}>{ExerciseList}</div>
        </div>
      ) : (
        <>
          {HeroPanel}
          {ExerciseList}

          {/* Fixed action bar */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
            <div style={{ height: 32, background: `linear-gradient(to bottom, transparent, ${K.bg})`, pointerEvents: 'none' }} />
            <div style={{
              backgroundColor: K.bg, padding: '0 16px',
              paddingBottom: 'max(env(safe-area-inset-bottom), 20px)', paddingTop: 4,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <button
                onClick={handleComplete}
                disabled={!canComplete || saveStatus === 'saving'}
                style={{
                  width: '100%', minHeight: 54,
                  background: canComplete ? K.gradD : K.inset,
                  color: canComplete ? '#fff' : K.dim,
                  borderRadius: 16, border: 'none',
                  fontFamily: FONT, fontWeight: 800, fontSize: 16,
                  cursor: canComplete ? 'pointer' : 'not-allowed',
                }}
              >
                {saveStatus === 'saving'
                  ? 'Saving…'
                  : canComplete ? `Mark day complete (${session.doneCount})` : 'Tick something off first'}
              </button>
              <button
                onClick={() => navigate(`/workout/${day.day}`)}
                style={{
                  width: '100%', minHeight: 40,
                  background: 'none', color: K.subtle, border: 'none',
                  fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >▶ Guided mode (timed)</button>
            </div>
          </div>
        </>
      )}

      {selectedExercise && (
        <ExerciseModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
      )}

      {browsing && (
        <ExerciseBrowser
          exercises={exercises}
          exclude={session.order}
          replacing={browsing.replacing || null}
          mode={mode}
          userEquipment={userEquipment}
          onPick={id => {
            if (browsing.replacing) session.swap(browsing.replacing.id, id)
            else session.add(id)
          }}
          onClose={() => setBrowsing(null)}
        />
      )}

      {finished && (
        <CompletionOverlay
          summary={finished}
          saveStatus={saveStatus}
          onDone={() => navigate('/')}
        />
      )}
    </div>
  )
}

// ── Completion ───────────────────────────────────────────────────────────────
function CompletionOverlay({ summary, saveStatus, onDone }) {
  const mins = Math.round(summary.elapsed / 60)
  const stats = [
    ['Exercises', summary.count],
    ['Sets',      summary.totalSets],
    ['XP',        `+${summary.xp}`],
    ...(mins > 0 ? [['Time', `${mins}m`]] : []),
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      backgroundColor: 'rgba(3,6,14,0.9)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 380, textAlign: 'center',
        backgroundColor: K.card, border: `1px solid ${K.borderSt}`,
        borderRadius: 22, padding: 30,
      }}>
        <div style={{
          width: 66, height: 66, borderRadius: '50%', background: K.gradD,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px', color: '#fff',
        }}>
          <Icon name="check" size={32} strokeWidth={2.5} />
        </div>

        <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: K.text, margin: '0 0 6px' }}>
          Day complete
        </h2>
        <p style={{ fontSize: 14, color: K.muted, margin: '0 0 22px' }}>
          {saveStatus === 'error'
            ? 'Saved on this device — it will sync when you are back online.'
            : 'Logged. Nice work.'}
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {stats.map(([label, value]) => (
            <div key={label} style={{ flex: 1, backgroundColor: K.inset, borderRadius: 12, padding: '12px 6px' }}>
              <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 19, color: K.text, margin: 0 }}>{value}</p>
              <p style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '3px 0 0' }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onDone}
          style={{
            width: '100%', minHeight: 50, background: K.gradD, color: '#fff',
            border: 'none', borderRadius: 14,
            fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}
        >Done</button>
      </div>
    </div>
  )
}
